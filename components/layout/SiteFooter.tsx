import Link from "next/link";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn
} from "react-icons/fa";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      {/* Top section with four columns */}
      <div className={styles.top}>
        <div className={styles.brand}>
          <h2>Rani Riwaaj</h2>
          <p>
            Celebrating the timeless craft of Phulkari through modern,
            wearable art.
          </p>
        </div>
        <div className={styles.links}>
          <h3>Quick Links</h3>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/about">About Us</Link></li>
          </ul>
        </div>
        <div className={styles.contact}>
          <h3>Contact</h3>
          <p><a href="mailto:hello@raniriwaaj.com">hello@raniriwaaj.com</a></p>
          <p><a href="tel:+919510394742">+91 95103 94742</a></p>
        </div>
        <div className={styles.social}>
          <h3>Follow Us</h3>
          <div className={styles.icons}>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
        </div>
      </div>
      <hr className={styles.divider} />
      {/* Bottom copyright */}
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Rani Riwaaj. All rights reserved.</p>
      </div>
    </footer>
  );
}
