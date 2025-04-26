/* components/layout/SiteFooter.tsx */
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        &copy;{new Date().getFullYear()} Rani Riwaaj. All rights reserved.
      </p>
      <p>
        <a href="#">Privacy&nbsp;Policy</a>&nbsp;|&nbsp;
        <a href="#">Terms&nbsp;&amp;&nbsp;Conditions</a>
      </p>
    </footer>
  );
}