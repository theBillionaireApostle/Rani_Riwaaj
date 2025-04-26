/* components/layout/SiteHeader.tsx
   -------------------------------- */
   "use client";

   import Link from "next/link";
   import Image from "next/image";
   import { usePathname, useRouter } from "next/navigation";
   import { useEffect, useState } from "react";
   import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
   import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
   import { auth } from "../../app/firebaseClient";  
    import { onAuthStateChanged, signOut, User } from "firebase/auth";
   import styles from "./SiteHeader.module.css";
   
   export default function SiteHeader() {
     const [user, setUser] = useState<User | null>(null);
     const [authReady, setAuthReady] = useState(false);
     const [count, setCount] = useState(0);
     const router = useRouter();
     const pathname = usePathname();              // highlight active nav links (opt.)
   
     /* auth */
     useEffect(
       () =>
         onAuthStateChanged(auth, (u) => {
           setUser(u);
           setAuthReady(true);
         }),
       []
     );
   
     /* cart-counter — re-fetch whenever user changes */
     useEffect(() => {
       if (!user) return;
   
       (async () => {
         const res = await fetch(
           `${process.env.NEXT_PUBLIC_API_URL}/api/cart?userId=${user.uid}`
         );
         if (res.ok) {
           const json = await res.json();
           setCount(
             (json.items as { quantity: number }[]).reduce(
               (acc, i) => acc + i.quantity,
               0
             )
           );
         }
       })();
     }, [user]);
   
     return (
       <nav className={styles.nav}>
         <Link href="/" className={styles.logo}>
         Rani&nbsp;Riwaaj
         </Link>
   
         {/* right-part */}
         <div className={styles.right}>
           {!authReady ? (
             <div className={styles.loader} />
           ) : user ? (
             <>
               <Link href="/cart" className={styles.cartLink}>
                 <FontAwesomeIcon icon={faShoppingCart} />
                 {count > 0 && <span className={styles.badge}>{count}</span>}
               </Link>
               <UserDropdown user={user} onLogout={() => signOut(auth)} />
             </>
           ) : (
             <Link href="/signin" className={styles.signinBtn}>
               Sign&nbsp;In&nbsp;/&nbsp;Sign&nbsp;Up
             </Link>
           )}
         </div>
       </nav>
     );
   }
   
   /* -------------------- */
   function UserDropdown({
     user,
     onLogout,
   }: {
     user: User;
     onLogout: () => void;
   }) {
     const [open, setOpen] = useState(false);
   
     const initials =
       user.displayName?.split(" ").map((n) => n[0])?.join("")?.toUpperCase() ??
       user.email?.[0].toUpperCase() ??
       "U";
   
     return (
       <div className={styles.dropdown}>
         <button className={styles.avatar} onClick={() => setOpen(!open)}>
           {initials}
         </button>
         {open && (
           <div className={styles.menu}>
             <button onClick={onLogout}>Logout</button>
           </div>
         )}
       </div>
     );
   }