import { getBags } from "@/app/admin/actions";
import { Bag } from "@/types/bag";
import Link from "next/link";
import Image from "next/image";
import styles from './ManageBags.module.css';

// Icons as SVG components
const PencilIcon = () => (
  <svg className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EyeIcon = () => (
  <svg className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className={styles.addButtonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default async function ManageBagsPage() {
  const bags: Bag[] = await getBags();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manage Bags</h1>
        <Link href="/admin/bags/add" className={styles.addButton}>
          <PlusIcon />
          <span>Add New Bag</span>
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bags.map((bag) => {
              const defaultImage = bag.images.find(img => img.isDefault) || bag.images[0];
              
              return (
                <tr key={bag.id}>
                  <td className={styles.imageCell}>
                    <div className={styles.imageWrapper}>
                      {defaultImage ? (
                        <Image
                          className={styles.image}
                          src={defaultImage.url}
                          alt={bag.name}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <span className={styles.noImageText}>No image</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.bagName}>{bag.name}</div>
                    <div className={styles.bagDescription} title={bag.description}>
                      {bag.description}
                    </div>
                  </td>
                  <td className={styles.price}>
                    ${bag.price.toFixed(2)}
                  </td>
                  <td>
                    <span className={`${styles.status} ${bag.isAvailable ? styles.statusAvailable : styles.statusUnavailable}`}>
                      {bag.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/bags/${bag.id}`}
                        target="_blank"
                        className={`${styles.actionButton}`}
                        title="View"
                      >
                        <EyeIcon />
                      </Link>
                      <Link
                        href={`/admin/bags/edit/${bag.id}`}
                        className={`${styles.actionButton}`}
                        title="Edit"
                      >
                        <PencilIcon />
                      </Link>
                      <button
                        className={`${styles.actionButton} delete`}
                        title="Delete"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm('Are you sure you want to delete this bag?')) {
                            // TODO: Implement delete functionality
                          }
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {bags.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No bags found. <Link href="/admin/bags/add" className={styles.emptyStateLink}>
                    Add your first bag
                  </Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
