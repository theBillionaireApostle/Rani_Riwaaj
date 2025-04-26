/* app/products/[id]/loading.tsx */
import styles from "./page.module.css";

export default function ProductLoading() {
  return (
    <main className={styles.pageCenter}>
      <span className={styles.bigSpinner} aria-label="Loading product…" />
    </main>
  );
}