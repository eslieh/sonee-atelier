import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import InteractiveHeader from "@/components/InteractiveHeader";
import InteractiveHero from "@/components/InteractiveHero";
import styles from "./page.module.css";

type BagImage = {
  url: string;
  isDefault?: boolean;
  publicId?: string;
};

type BagRecord = {
  id: number;
  created_at: string;
  name: string | null;
  description: string | null;
  color: string | null;
  size: string | null;
  pricing: number | null;
  available: boolean | null;
  images: BagImage[] | null;
};

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

function getHeroImage(images: BagImage[] | null | undefined) {
  if (!images?.length) return null;
  return images.find((image) => image.isDefault) ?? images[0];
}

async function getAvailableBags(): Promise<BagRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bags")
    .select("*")
    .eq("available", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return [];
  }

  return data.map((bag: any) => ({
    id: bag.id,
    created_at: bag.created_at,
    name: bag.name,
    description: bag.description,
    color: bag.color,
    size: bag.size,
    pricing: bag.pricing,
    available: bag.available,
    images: Array.isArray(bag.images)
      ? bag.images.map((img: any) => ({
          url: img.url,
          isDefault: img.isDefault ?? img.is_default ?? false,
          publicId: img.publicId ?? img.public_id,
        }))
      : null,
  }));
}

export const metadata: Metadata = {
  title: "Sonie Atelier | Premium Handcrafted Bags",
  description: "Discover our curated collection of premium handcrafted carry bags. Each piece is carefully designed and crafted with attention to detail. Shop unique, stylish bags at Sonie Atelier.",
  keywords: ["handcrafted bags", "premium bags", "carry bags", "leather bags", "Sonie Atelier", "luxury bags", "Kenya bags"],
  authors: [{ name: "Sonie Atelier" }],
  openGraph: {
    title: "Sonie Atelier | Premium Handcrafted Bags",
    description: "Discover our curated collection of premium handcrafted carry bags. Each piece is carefully designed and crafted with attention to detail.",
    type: "website",
    siteName: "Sonie Atelier",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Sonie Atelier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sonie Atelier | Premium Handcrafted Bags",
    description: "Discover our curated collection of premium handcrafted carry bags.",
    images: ["/logo.png"],
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
    canonical: "/",
  },
};

export default async function Home() {
  const bags = await getAvailableBags();

  return (
    <div className={styles.page}>
      <InteractiveHeader />

      <main className={styles.main}>
        <InteractiveHero />

        <section id="collection" className={styles.collection}>
          <div className={styles.collectionHeader}>
            <p className={styles.collectionTag}>Collection</p>
            <h2 className={styles.collectionTitle}>Carry Bag</h2>
          </div>

          {bags.length === 0 ? (
            <div className={styles.empty}>
              <p>New silhouettes will appear here soon.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {bags.map((bag) => {
                const hero = getHeroImage(bag.images);
                const formattedPrice = bag.pricing ? currency.format(bag.pricing) : "—";

                return (
                  <Link key={bag.id} href={`/bag/${bag.id}`} className={styles.card}>
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardName}>{bag.name ?? "Untitled bag"}</h3>
                      <div className={styles.cardImageContainer}>
                        {hero ? (
                          <Image
                            src={hero.url}
                            alt={bag.name ?? "Bag"}
                            fill
                            className={styles.cardImage}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.cardPlaceholder} />
                        )}
                      </div>
                      {bag.description && (
                        <p className={styles.cardDescription}>{bag.description}</p>
                      )}
                      <div className={styles.cardMeta}>
                        <span className={styles.cardPrice}>{formattedPrice}</span>
                        {bag.color && (
                          <span className={styles.cardColor}>{bag.color}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>Sonie Atelier</p>
      </footer>
    </div>
  );
}
