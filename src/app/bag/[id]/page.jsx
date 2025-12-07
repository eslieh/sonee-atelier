import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BagImageGallery } from "@/components/BagImageGallery";
import { ShareButton } from "@/components/ShareButton";
import styles from "./page.module.css";

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

function getHeroImage(images) {
  if (!images?.length) return null;
  return images.find((image) => image.isDefault) ?? images[0];
}

async function getBag(id) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bags")
    .select("*")
    .eq("id", id)
    .eq("available", true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    created_at: data.created_at,
    name: data.name,
    description: data.description,
    color: data.color,
    size: data.size,
    pricing: data.pricing,
    available: data.available,
    images: Array.isArray(data.images)
      ? data.images.map((img) => ({
          url: img.url,
          isDefault: img.isDefault ?? img.is_default ?? false,
          publicId: img.publicId ?? img.public_id,
        }))
      : null,
  };
}

async function getMoreBags(excludeId) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bags")
    .select("*")
    .eq("available", true)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error || !data) {
    return [];
  }

  return data.map((bag) => ({
    id: bag.id,
    created_at: bag.created_at,
    name: bag.name,
    description: bag.description,
    color: bag.color,
    size: bag.size,
    pricing: bag.pricing,
    available: bag.available,
    images: Array.isArray(bag.images)
      ? bag.images.map((img) => ({
          url: img.url,
          isDefault: img.isDefault ?? img.is_default ?? false,
          publicId: img.publicId ?? img.public_id,
        }))
      : null,
  }));
}

async function getWhatsAppNumber() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("settings")
    .select("whatsapp_number")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.whatsapp_number;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const bagId = Number(id);
  
  if (Number.isNaN(bagId)) {
    return {
      title: "Bag Not Found | Sonie Atelier",
    };
  }

  const bag = await getBag(bagId);

  if (!bag) {
    return {
      title: "Bag Not Found | Sonie Atelier",
    };
  }

  const heroImage = getHeroImage(bag.images);
  const ogImage = heroImage?.url || "/logo.png";
  const bagName = bag.name ?? "Untitled bag";
  const description = bag.description || `Discover ${bagName} at Sonie Atelier. Premium handcrafted carry bag${bag.color ? ` in ${bag.color}` : ""}${bag.size ? `, size ${bag.size}` : ""}.`;
  const formattedPrice = bag.pricing ? currency.format(bag.pricing) : null;
  
  // Build full URL for OG image
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const ogImageUrl = ogImage.startsWith("http") ? ogImage : `${protocol}://${host}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;
  const canonicalUrl = `${protocol}://${host}/bag/${bagId}`;

  const title = `${bagName} | Sonie Atelier`;
  const metaDescription = `${description}${formattedPrice ? ` Price: ${formattedPrice}.` : ""} Shop now at Sonie Atelier.`;

  return {
    title,
    description: metaDescription,
    keywords: [
      bagName,
      "handcrafted bags",
      "premium bags",
      "carry bags",
      bag.color,
      bag.size,
      "Sonie Atelier",
      "Kenya bags",
    ].filter(Boolean),
    authors: [{ name: "Sonie Atelier" }],
    openGraph: {
      title,
      description: metaDescription,
      type: "website",
      siteName: "Sonie Atelier",
      url: canonicalUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: bagName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDescription,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default async function BagDetailPage({ params }) {
  const { id } = await params;
  const bagId = Number(id);
  
  if (Number.isNaN(bagId)) {
    notFound();
  }

  const bag = await getBag(bagId);

  if (!bag) {
    notFound();
  }

  const moreBags = await getMoreBags(bagId);
  const whatsappNumber = await getWhatsAppNumber();

  const images = bag.images || [];
  const formattedPrice = bag.pricing ? currency.format(bag.pricing) : "—";

  // Build WhatsApp message
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const productUrl = `${protocol}://${host}/bag/${bagId}`;
  
  const messageParts = [
    `Hello! I'm interested in:`,
    `\n*${bag.name ?? "Untitled bag"}*`,
    bag.description ? `\n${bag.description}` : "",
    bag.color ? `\nColor: ${bag.color}` : "",
    bag.size ? `\nSize: ${bag.size}` : "",
    formattedPrice !== "—" ? `\nPrice: ${formattedPrice}` : "",
    `\n\nView product: ${productUrl}`
  ];
  
  const whatsappMessage = encodeURIComponent(messageParts.filter(Boolean).join(""));
  const whatsappUrl = whatsappNumber 
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${whatsappMessage}`
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={16} className={styles.backIcon} />
          <span>Back</span>
        </Link>
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/logo.png"
            alt="Sonie Atelier"
            width={120}
            height={40}
            className={styles.logo}
            priority
          />
        </Link>
        <div className={styles.headerSpacer} />
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.imageSection}>
            <BagImageGallery images={images} bagName={bag.name} />
          </div>

          <div className={styles.detailsSection}>
            <div className={styles.detailsContent}>
              <h1 className={styles.bagName}>{bag.name ?? "Untitled bag"}</h1>
              
              {bag.description && (
                <p className={styles.description}>{bag.description}</p>
              )}

              <div className={styles.priceBadge}>
                <span className={styles.price}>{formattedPrice}</span>
              </div>

              <div className={styles.specs}>
                {bag.color && (
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Color</span>
                    <span className={styles.specValue}>{bag.color}</span>
                  </div>
                )}
                {bag.size && (
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Size</span>
                    <span className={styles.specValue}>{bag.size}</span>
                  </div>
                )}
              </div>

              <div className={styles.actionButtons}>
                {whatsappUrl ? (
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.orderButton}
                  >
                    <WhatsAppIcon size={18} />
                    <span>Order on WhatsApp</span>
                  </a>
                ) : (
                  <Link href="/#collection" className={styles.orderButton}>
                    Order now
                  </Link>
                )}
                <ShareButton 
                  url={productUrl}
                  title={bag.name ?? "Untitled bag"}
                  description={bag.description || undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {moreBags.length > 0 && (
          <section className={styles.moreSection}>
            <div className={styles.moreHeader}>
              <p className={styles.moreTag}>Collection</p>
              <h2 className={styles.moreTitle}>More from collection</h2>
            </div>
            <div className={styles.moreGrid}>
              {moreBags.map((otherBag) => {
                const hero = getHeroImage(otherBag.images);
                const formattedBagPrice = otherBag.pricing ? currency.format(otherBag.pricing) : "—";

                return (
                  <Link key={otherBag.id} href={`/bag/${otherBag.id}`} className={styles.moreCard}>
                    <div className={styles.moreCardImageContainer}>
                      {hero ? (
                        <Image
                          src={hero.url}
                          alt={otherBag.name ?? "Bag"}
                          fill
                          className={styles.moreCardImage}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.moreCardPlaceholder} />
                      )}
                    </div>
                    <div className={styles.moreCardContent}>
                      <h3 className={styles.moreCardName}>{otherBag.name ?? "Untitled bag"}</h3>
                      <div className={styles.moreCardMeta}>
                        <span className={styles.moreCardPrice}>{formattedBagPrice}</span>
                        {otherBag.color && (
                          <span className={styles.moreCardColor}>{otherBag.color}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

