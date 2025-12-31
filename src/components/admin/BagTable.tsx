import Image from "next/image";
import Link from "next/link";

import styles from "./BagTable.module.css";

type BagImage = {
  url: string;
  isDefault?: boolean;
  publicId?: string;
};

export type BagRecord = {
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

function getOtherImages(images: BagImage[] | null | undefined) {
  if (!images?.length) return [];
  const hero = getHeroImage(images);
  if (!hero) return images;
  return images.filter((img) => img.url !== hero.url).slice(0, 3); // Show max 3 additional images
}

export function BagTable({ bags }: { bags: BagRecord[] }) {
  if (!bags.length) {
    return (
      <section className={styles.dashboard}>
        <header className={styles.header}>
          <div>
            <p className={styles.tag}>Collection</p>
            <h1>Launch your first bag</h1>
            <p className={styles.subtitle}>
              New silhouettes will appear here once you publish them. Start by creating your hero bag.
            </p>
          </div>
          <Link className={styles.cta} href="/admin/add-bag">
            Create bag
          </Link>
        </header>
        <div className={styles.empty}>
          <p>No bags yet. Curate your first drop to see it listed in the atelier dashboard.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <p className={styles.tag}>Collection</p>
          <h1>Sonee Atelier Catalog</h1>
          <p className={styles.subtitle}>Track every silhouette, availability state, and hero pricing at a glance.</p>
        </div>
        <Link className={styles.cta} href="/admin/add-bag">
          Create bag
        </Link>
      </header>

      <div className={styles.grid}>
        {bags.map((bag) => {
          const hero = getHeroImage(bag.images);
          const otherImages = getOtherImages(bag.images);
          const formattedPrice = bag.pricing ? currency.format(bag.pricing) : "—";
          const status = bag.available ? "Available" : "Preview";
          const updated = new Date(bag.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div key={bag.id} className={styles.card}>
              <Link href={`/admin/bags/${bag.id}`} className={styles.cardLink}>
                <div className={styles.imageContainer}>
                  {hero ? (
                    <>
                      {/* Stacked background images */}
                      {otherImages.length > 0 && (
                        <div className={styles.imageStack}>
                          {otherImages.map((img, idx) => (
                            <div key={idx} className={styles.stackImage}>
                              <Image
                                src={img.url}
                                alt={`${bag.name ?? "Bag"} view ${idx + 2}`}
                                fill
                                className={styles.stackImageContent}
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Main hero image */}
                      <div className={styles.heroImage}>
                        <Image
                          src={hero.url}
                          alt={bag.name ?? "Bag cover"}
                          fill
                          className={styles.heroImageContent}
                          unoptimized
                        />
                      </div>
                    </>
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.cardDetails}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.bagName}>{bag.name ?? "Untitled bag"}</h3>
                    <span className={bag.available ? styles.statusLive : styles.statusDraft}>{status}</span>
                  </div>
                  {bag.description && (
                    <p className={styles.bagDescription}>{bag.description}</p>
                  )}
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Price</span>
                      <span className={styles.metaValue}>{formattedPrice}</span>
                    </div>
                    {bag.color && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Color</span>
                        <span className={styles.metaValue}>{bag.color}</span>
                      </div>
                    )}
                    {bag.size && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Size</span>
                        <span className={styles.metaValue}>{bag.size}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.updated}>Updated {updated}</span>
                    <span className={styles.manageLink}>Manage →</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

