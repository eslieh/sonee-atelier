"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, clearAdminSession, getAdminUser, requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Bag } from "@/types/bag";

export type LoginState = {
  error?: string;
  success?: boolean;
};

type SignupState = {
  error?: string;
};

type CreateBagState = {
  error?: string;
  success?: boolean;
};

type UpdateBagState = {
  error?: string;
  success?: boolean;
};

type DeleteBagState = {
  error?: string;
  success?: boolean;
};

type UpdateSettingsState = {
  error?: string;
  success?: boolean;
};

async function persistAdminSession({
  access_token,
  refresh_token,
  expires_at,
  email,
}: {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  email: string;
}) {
  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    JSON.stringify({ access_token, refresh_token, expires_at, email }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
}

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return { error: error?.message ?? "Invalid credentials. Please try again." };
  }

  await persistAdminSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? Date.now() / 1000 + 60 * 60, // fallback to 1 hour from now if undefined
    email,
  });

  redirect("/admin/bags");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function loginWithGoogleAction() {
  const supabase = getSupabaseServerClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/admin/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const message = error?.message ?? "Unable to start Google sign-in.";
    redirect(`/admin?error=${encodeURIComponent(message)}`);
  }

  redirect(data.url);
}

export async function signupAction(_: SignupState, formData: FormData): Promise<SignupState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "Please verify your email before signing in." };
  }

  await persistAdminSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? Date.now() / 1000 + 60 * 60, // fallback to 1 hour from now if undefined
    email,
  });

  redirect("/admin/bags");
}

function toBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return false;
  return value === "true" || value === "on";
}

export async function getBags(): Promise<Bag[]> {
  const supabase = getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const { data: bags, error } = await supabase
    .from('bags')
    .select(`
      *,
      images (
        id,
        url,
        is_default,
        public_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bags:', error);
    throw error;
  }

  // Transform the data to match our Bag type
  return bags.map(bag => ({
    ...bag,
    images: (bag.images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      isDefault: img.is_default,
      publicId: img.public_id
    })),
    isAvailable: bag.is_available,
    createdAt: bag.created_at,
    updatedAt: bag.updated_at
  }));
}

export async function createBagAction(_: CreateBagState, formData: FormData): Promise<CreateBagState> {
  try {
    // Get authenticated user and supabase client
    const user = await getAdminUser();
    if (!user) {
      return { error: "Unauthorized. Please login to continue." };
    }

    const supabase = getSupabaseServerClient();

    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || null;
    const color = formData.get("color")?.toString().trim() || null;
    const size = formData.get("size")?.toString().trim() || null;
    const priceString = formData.get("pricing")?.toString().trim();
    const available = toBoolean(formData.get("available"));
    const defaultImageIndex = Number(formData.get("defaultImageIndex") ?? "0");
    const imagesPayload = formData.get("imagesPayload")?.toString();

    if (!name) {
      return { error: "A bag name is required." };
    }

    const price = priceString ? Number(priceString) : null;
    if (priceString && Number.isNaN(price)) {
      return { error: "Price must be a valid number." };
    }

    let uploadedImages: { url: string; publicId: string }[] = [];
    if (imagesPayload) {
      try {
        uploadedImages = JSON.parse(imagesPayload);
      } catch {
        return { error: "Images payload is invalid. Please re-upload your images." };
      }
    }

    if (!uploadedImages.length) {
      return { error: "Please upload at least one image." };
    }

    const normalizedIndex = Number.isFinite(defaultImageIndex) ? defaultImageIndex : 0;
    const safeDefaultIndex = Math.min(Math.max(0, normalizedIndex), uploadedImages.length - 1);

    const images = uploadedImages.map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      isDefault: index === safeDefaultIndex,
    }));

    // const superbase = await getSupabaseServerClient();
    // Use the authenticated supabase client
    const { data, error } = await supabase
      .from("bags")
      .insert({
        user_id: user.id,
        name,
        description,
        color,
        size,
        pricing: price,
        available,
        images,
      })
      .select();

    if (error) {
      console.error("Error creating bag:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in createBagAction:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

export async function updateBagAction(
  bagId: number,
  _: UpdateBagState,
  formData: FormData,
): Promise<UpdateBagState> {
  try {
    const user = await getAdminUser();
    if (!user) {
      return { error: "Unauthorized. Please login to continue." };
    }

    const supabase = getSupabaseServerClient();

    const name = formData.get("name")?.toString().trim();
    const description = formData.get("description")?.toString().trim() || null;
    const color = formData.get("color")?.toString().trim() || null;
    const size = formData.get("size")?.toString().trim() || null;
    const priceString = formData.get("pricing")?.toString().trim();
    const available = toBoolean(formData.get("available"));
    const defaultImageIndex = Number(formData.get("defaultImageIndex") ?? "0");
    const imagesPayload = formData.get("imagesPayload")?.toString();

    if (!name) {
      return { error: "A bag name is required." };
    }

    const price = priceString ? Number(priceString) : null;
    if (priceString && Number.isNaN(price)) {
      return { error: "Price must be a valid number." };
    }

    // Parse images payload - includes both existing and new images
    let images: { url: string; publicId?: string; isDefault: boolean }[] = [];
    
    if (imagesPayload) {
      try {
        const uploadedImages: { url: string; publicId?: string }[] = JSON.parse(imagesPayload);
        if (uploadedImages.length > 0) {
          const normalizedIndex = Number.isFinite(defaultImageIndex) ? defaultImageIndex : 0;
          const safeDefaultIndex = Math.min(Math.max(0, normalizedIndex), uploadedImages.length - 1);
          images = uploadedImages.map((image, index) => ({
            url: image.url,
            publicId: image.publicId,
            isDefault: index === safeDefaultIndex,
          }));
        }
      } catch {
        return { error: "Images payload is invalid. Please try again." };
      }
    } else {
      // If no payload, get existing images from database
      const { data: existingBag } = await supabase
        .from("bags")
        .select("images")
        .eq("id", bagId)
        .single();

      images = existingBag?.images || [];
      if (images.length > 0) {
        // Update default image index for existing images
        const normalizedIndex = Number.isFinite(defaultImageIndex) ? defaultImageIndex : 0;
        const safeDefaultIndex = Math.min(Math.max(0, normalizedIndex), images.length - 1);
        images = images.map((image: any, index: number) => ({
          ...image,
          isDefault: index === safeDefaultIndex,
        }));
      }
    }

    if (!images.length) {
      return { error: "Please upload at least one image." };
    }

    const { error } = await supabase
      .from("bags")
      .update({
        name,
        description,
        color,
        size,
        pricing: price,
        available,
        images,
      })
      .eq("id", bagId)
      .eq("user_id", user.id); // Ensure user owns the bag

    if (error) {
      console.error("Error updating bag:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in updateBagAction:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

export async function deleteBagAction(bagId: number): Promise<DeleteBagState> {
  try {
    const user = await getAdminUser();
    if (!user) {
      return { error: "Unauthorized. Please login to continue." };
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("bags")
      .delete()
      .eq("id", bagId)
      .eq("user_id", user.id); // Ensure user owns the bag

    if (error) {
      console.error("Error deleting bag:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteBagAction:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

export async function getSettings(): Promise<{ whatsapp_number: string | null } | null> {
  try {
    await requireAdmin();
    const supabase = getSupabaseServerClient();

    // Get the first settings record (assuming there's only one)
    const { data, error } = await supabase
      .from("settings")
      .select("whatsapp_number")
      .limit(1)
      .single();

    if (error) {
      // If no record exists, return null (not an error)
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching settings:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in getSettings:", error);
    return null;
  }
}

export async function updateSettingsAction(
  _: UpdateSettingsState,
  formData: FormData,
): Promise<UpdateSettingsState> {
  try {
    const user = await getAdminUser();
    if (!user) {
      return { error: "Unauthorized. Please login to continue." };
    }

    const supabase = getSupabaseServerClient();

    const whatsappNumber = formData.get("whatsapp_number")?.toString().trim() || null;

    // Check if settings record exists
    const { data: existingSettings, error: fetchError } = await supabase
      .from("settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching settings:", fetchError);
      return { error: fetchError.message };
    }

    if (existingSettings) {
      // Update existing record
      const { error } = await supabase
        .from("settings")
        .update({ whatsapp_number: whatsappNumber })
        .eq("id", existingSettings.id);

      if (error) {
        console.error("Error updating settings:", error);
        return { error: error.message };
      }
    } else {
      // Create new record if none exists
      const { error } = await supabase
        .from("settings")
        .insert({ whatsapp_number: whatsappNumber });

      if (error) {
        console.error("Error creating settings:", error);
        return { error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in updateSettingsAction:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return { error: message };
  }
}

