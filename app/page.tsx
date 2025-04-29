"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // for redirection
// Import FontAwesome icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faHeart,faThLarge,faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import {
  
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
// Import Firebase auth functions and the auth object
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "./firebaseClient";
import styles from "./page.module.css";
import { toast } from "react-toastify";

// break an array into sub-arrays of length `size`
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

// Define a type for a cart item.
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}


interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: { url: string };
}
type Product = {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  colors?: string[];
  sizes?: string[];
  reviews?: number;
  rating?: number;
  justIn?: boolean;
  badgeLabel?: string;
  defaultImage?: { url: string };
};

interface Props {
  productsLoading: boolean;
  visibleProducts: Product[];
  handleAddToCart: (p: Product) => void;
  handleWhatsAppEnquiry: (p: Product) => void;
  loadMoreRef: React.RefObject<HTMLDivElement>;
}


export default function Home() {
  const router = useRouter();
  // Products state initialized to an empty array
  const [products, setProducts] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const ITEMS_PER_PAGE = 6;
  const totalItems = (categories.length ?? 0) + 1; // +1 for “All”
  const showArrows = !categoriesLoading && totalItems > ITEMS_PER_PAGE;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);


  const [sortOption, setSortOption] = useState<
  "date-desc"   // newest first
  | "date-asc"  // oldest first
  | "price-asc"
  | "price-desc"
>("date-desc"); 
  const [filterJustIn, setFilterJustIn] = useState("");
  // Visible count for lazy loading
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // New state for Firebase user and auth loading
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State to track product loading
  const [productsLoading, setProductsLoading] = useState(true);


  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const check = () => {
      setCanScrollPrev(el.scrollLeft > 0);
      setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    el.addEventListener("scroll", check);
    check();
    return () => el.removeEventListener("scroll", check);
  }, [categoriesLoading, categories]);

  // Scroll one “page” of ITEMS_PER_PAGE at a time
  const scrollCategories = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    // item width + gap (64px + 16px) times ITEMS_PER_PAGE
    const itemWidth = el.firstElementChild?.clientWidth ?? 80;
    const gap = 16; 
    const scrollAmount = direction * ITEMS_PER_PAGE * (itemWidth + gap);
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Fetch products on component mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/products");
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);


   // fetch categories
   useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        setCategories(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // When authenticated, fetch the cart and calculate the total count
  useEffect(() => {
    if (user) {
      async function fetchCart() {
        try {
          const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/cart?userId=${user.uid}`);
          if (!res.ok) {
            throw new Error("Failed to fetch cart");
          }
          const cartData = await res.json();
          if (cartData && Array.isArray(cartData.items)) {
            const totalCount = cartData.items.reduce(
              (acc: number, item: any) => acc + item.quantity,
              0
            );
            setCartCount(totalCount);
            setCartItems(cartData.items);
          } else {
            setCartCount(0);
            setCartItems([]);
          }
        } catch (error) {
          console.error(error);
        }
      }
      fetchCart();
    }
  }, [user]);

  function parsePrice(value: string | number | undefined | null): number {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    // remove all commas, trim, then parse float
    const cleaned = String(value).replace(/,/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  // Reset visible count when filtered/sorted products change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, sortOption, filterJustIn, products]);

  // Derived data: filtering and sorting
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterJustIn === ""
        ? true
        : filterJustIn === "justIn"
        ? p.justIn === true
        : p.justIn === false)
    );
  }, [products, searchTerm, filterJustIn]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
  
    // helper to parse "1,499" → 1499
    const parsePrice = (p: Product) =>
      typeof p.price === "string"
        ? Number(p.price.replace(/[^\d.]/g, ""))
        : p.price;
  
    if (sortOption === "date-desc") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortOption === "date-asc") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortOption === "price-asc") {
      sorted.sort((a, b) => parsePrice(a) - parsePrice(b));
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => parsePrice(b) - parsePrice(a));
    }
  
    return sorted;
  }, [filteredProducts, sortOption]);


  const enrichedProducts = useMemo(() => {
    return sortedProducts.map((p) => {
      // 1) Normalize both fields
      const priceNum      = parsePrice(p.price);
      const originalNum   = p.originalPrice != null
        ? parsePrice(p.originalPrice)
        : // if missing, assume a 10–20% higher MSRP for demo
          Math.round(priceNum * (1 + (Math.random() * 0.1 + 0.1)));
  
      // 2) Compute discount only when original > price
      const discountPercent =
        originalNum > priceNum
          ? Math.round((1 - priceNum / originalNum) * 100)
          : 0;
  
      // 3) Fill in any other missing details realistically
      const colors = p.colors && p.colors.length > 0
        ? p.colors
        : ["#E91E63", "#03A9F4", "#4CAF50"];
      const sizes = p.sizes && p.sizes.length > 0
        ? p.sizes
        : ["S", "M", "L", "XL"];
      const reviews = typeof p.reviews === "number"
        ? p.reviews
        : Math.floor(Math.random() * 190 + 10); // 10–200
      const rating = typeof p.rating === "number"
        ? p.rating
        : parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)); // 3.5–5.0
      const badgeLabel = p.justIn
        ? "Just In"
        : Math.random() < 0.3
        ? "Bestseller"
        : undefined;
  
      return {
        ...p,
        price: priceNum,
        originalPrice: originalNum,
        discountPercent,
        colors,
        sizes,
        reviews,
        rating,
        badgeLabel,
      };
    });
  }, [sortedProducts]);

  // Products to display based on lazy loading
  const visibleProducts = useMemo(
    () => enrichedProducts.slice(0, visibleCount),
    [enrichedProducts, visibleCount]
  );

  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    const onDown = (e: PointerEvent) => {
      isDown = true;
      el.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = el.scrollLeft;
      scrollTop = el.scrollTop;
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      // prevent text-select
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.scrollLeft = scrollLeft - dx;
      el.scrollTop  = scrollTop  - dy;
    };
    const onUp = (e: PointerEvent) => {
      isDown = false;
      el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup",   onUp);
    el.addEventListener("pointerleave", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup",   onUp);
      el.removeEventListener("pointerleave", onUp);
    };
  }, []);
   
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < sortedProducts.length) {
          setVisibleCount((prev) => Math.min(prev + 10, sortedProducts.length));
        }
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [visibleCount, sortedProducts]);

  // --- Add to Cart Handler ---
  const handleAddToCart = async (product: any) => {
    const priceNum = Number(product.price.replace(/[^\d]/g, ""));
    let updatedCartItems: CartItem[];

    const existingItem = cartItems.find(
      (item) => item.productId === product._id.toString()
    );

    if (existingItem) {
      updatedCartItems = cartItems.map((item) =>
        item.productId === product._id.toString()
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCartItems = [
        ...cartItems,
        {
          productId: product._id.toString(),
          name: product.name,
          price: priceNum,
          quantity: 1,
        },
      ];
    }

    // Redirect non-authenticated users to sign in
    if (!user) {
      router.push("/signin");
      return;
    }

    // Update local states
    setCartItems(updatedCartItems);
    const newCartCount = updatedCartItems.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
    setCartCount(newCartCount);

    try {
      const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          items: updatedCartItems,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update cart on the server");
      }
      // Show a professional toast message
      toast.success("Item added to Cart", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error: any) {
      console.error("Error updating the cart:", error);
      toast.error("Error updating your cart. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };


  const categoryOptions = useMemo(() => {
    return ["All", ...categories.map((c) => c.name)];
  }, [categories]);


  // WhatsApp enquiry functions.
  const getWhatsAppMessage = (product: any) => {
    return `I'm interested in ${product.name} priced at Rs ${product.price}. Please send me more details.`;
  };

  const handleWhatsAppEnquiry = (product: any) => {
    const message = encodeURIComponent(getWhatsAppMessage(product));
    window.open(
      `https://api.whatsapp.com/send?phone=+919510394742&text=${message}`,
      "_blank"
    );
  };

  return (
    <main className={styles.main}>
      {/* Header with flex layout */}
      <nav className={styles.nav}>
        <div className={styles.leftSection}>
          <div className={styles.logo}>Rani Riwaaj</div>
        </div>
        <div className={styles.rightSection}>
          {authLoading ? (
            <div className={styles.loader}></div>
          ) : user ? (
            <>
              <Link href="/cart" className={styles.cartLink}>
                <FontAwesomeIcon icon={faShoppingCart} />
                {cartCount > 0 && (
                  <span className={styles.badge}>{cartCount}</span>
                )}
              </Link>
              <UserDropdown
                user={user}
                cartCount={cartCount}
                onLogout={() => signOut(auth)}
              />
            </>
          ) : (
            <div className={styles.authContainer}>
              <Link href="/signin" className={styles.authLink}>
                Sign In / Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Experience Phulkari</h1>
          <p>
            Embrace the vibrant colors, intricate designs, and cultural richness of traditional Phulkari craftsmanship.
          </p>
          <button
            className={styles.heroButton}
            onClick={() => {
              const shopSection = document.getElementById("shop");
              if (shopSection) {
                shopSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Shop Now
          </button>
        </div>
      </section>

      {/* Controls: Search, Sort, Filter */}
      <section className={styles.controls}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
  value={sortOption}
  onChange={(e) => setSortOption(e.target.value as SortOption)}
  className={styles.selectInput}
>
  <option value="date-desc">Date Added: Newest First</option>
  <option value="date-asc">Date Added: Oldest First</option>
  <option value="price-asc">Price: Low to High</option>
  <option value="price-desc">Price: High to Low</option>
</select>
        <select
          value={filterJustIn}
          onChange={(e) => setFilterJustIn(e.target.value)}
          className={styles.selectInput}
        >
          <option value="">All Products</option>
          <option value="justIn">Just In</option>
          <option value="notJustIn">Not Just In</option>
        </select>
      </section>

      <section className={styles.categoryBar}>
    <div className={styles.container}>
      {categoriesLoading ? (
        <div className={styles.categoryLoading}>Loading categories…</div>
      ) : (
        <div className={styles.carouselWrapper}>

          {/* LEFT ARROW */}
          {showArrows && canScrollPrev && (
            <button
              className={`${styles.navArrow} ${styles.leftArrow}`}
              onClick={() => scrollCategories(-1)}
              aria-label="Previous categories"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          )}

          {/* SCROLLABLE CARDS */}
          <div className={styles.categoryScroller} ref={scrollerRef}>

            {/* “All” CARD */}
            <button
              className={`${styles.categoryItem} ${selectedCategory === "All" ? styles.activeItem : ""}`}
              onClick={() => setSelectedCategory("All")}
            >
              <div className={styles.avatarWrapper}>
                <FontAwesomeIcon icon={faThLarge} className={styles.avatarIcon} />
              </div>
              <span className={styles.avatarLabel}>All</span>
            </button>

            {/* DYNAMIC CATEGORY CARDS */}
            {categories.map((c) => (
              <Link
                 key={c._id}
                 href={`/category/${c.slug}`}          // ← new URL
                 className={`${styles.categoryItem} ${
                    selectedCategory === c.name ? styles.activeItem : ""
                  }`}
                 prefetch={false}                      // keeps JS payload small
                >
                <div className={styles.avatarWrapper}>
                  <Image
                    src={c.image?.url || "/placeholder.png"}
                    alt={c.name}
                    width={72}
                    height={72}
                    className={styles.avatarImg}
                  />
                </div>
                <span className={styles.avatarLabel}>{c.name}</span>
              </Link>
            ))}

          </div>

          {/* RIGHT ARROW */}
          {showArrows && canScrollNext && (
            <button
              className={`${styles.navArrow} ${styles.rightArrow}`}
              onClick={() => scrollCategories(1)}
              aria-label="Next categories"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}

        </div>
      )}
    </div>
  </section>

      {/* Products Section with Loader */}
     {/* Products Section with Loader */}
     <section id="shop" className={styles.featuredProducts}>
      <h2 className={styles.sectionTitle}>Featured Collections</h2>

      {productsLoading ? (
        <div className={styles.productsLoader}>
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.productsWrapper}>
          {visibleProducts.map((p) => (
            <Link
              key={p._id}
              href={`/products/${p._id}`}
              className={styles.productItemLink}
            >
              <div className={styles.productItem}>
                <div className={styles.productTopBar}>
                  <button
                    className={styles.wishlistBtn}
                    aria-label="Add to Wishlist"
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                  {p.justIn && (
                    <div className={styles.badgeJustIn}>Just In</div>
                  )}
                  {p.badgeLabel && (
                    <div className={styles.badgeMain}>{p.badgeLabel}</div>
                  )}
                  {p.rating != null && (
                    <div className={styles.ratingBadge}>
                      <FontAwesomeIcon icon={faStarSolid} />
                      {p.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className={styles.productImage}>
                  <Image
                    src={p.defaultImage?.url || "/placeholder.png"}
                    alt={p.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                </div>

                <div className={styles.productInfo}>
                  <div>
                    <h3 className={styles.productName}>{p.name}</h3>
                    <div className={styles.priceRow}>
                      <span className={styles.currentPrice}>
                        ₹{p.price}
                      </span>
                      {p.originalPrice && (
                        <>
                          <span className={styles.originalPrice}>
                            ₹{p.originalPrice}
                          </span>
                          <span className={styles.discountText}>
                            Save{" "}
                            {Math.round(
                              (1 - p.price / p.originalPrice) * 100
                            )}
                            %
                          </span>
                        </>
                      )}
                    </div>

                    {p.colors?.length && (
                      <div className={styles.colorRow}>
                        {p.colors.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className={styles.swatch}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        {p.colors.length > 3 && (
                          <span className={styles.moreColors}>
                            +{p.colors.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {p.sizes?.length && (
                      <div className={styles.sizeRow}>
                        {p.sizes.map((s, i) => (
                          <button key={i} className={styles.sizeOption}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {p.reviews != null && (
                      <div className={styles.reviewRow}>
                        <FontAwesomeIcon
                          icon={faStarSolid}
                          className={styles.starIcon}
                        />
                        <span className={styles.reviewsCount}>
                          {p.reviews} reviews
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    className={styles.addToCartBtn}
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </div>
      )}

      <div ref={loadMoreRef} className={styles.loadMore}></div>
    </section>
       

      {/* About Section */}
      <section id="about" className={styles.aboutUs}>
        <h2>Our Story</h2>
        <p>
          Rani Riwaaj celebrates the age-old craft of Phulkari—literally meaning “flower work.” Each piece is lovingly created with meticulous attention to detail, reflecting a tradition passed down for generations. Our mission is to bring this radiant heritage to you by blending traditional artistry with modern aesthetics.
        </p>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Rani Riwaaj. All rights reserved.</p>
        <p>
          <a href="#">Privacy Policy</a> | <a href="#">Terms &amp; Conditions</a>
        </p>
      </footer>
    </main>
  );
}

// ---------------- UserDropdown Component ----------------
type UserDropdownProps = {
  user: User;
  cartCount: number;
  onLogout: () => void;
};

function UserDropdown({ user, cartCount, onLogout }: UserDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  // Helper to get user initials
  const getInitials = (user: User) => {
    if (user.displayName) {
      const names = user.displayName.split(" ");
      if (names.length === 1) return names[0].charAt(0).toUpperCase();
      return (
        names[0].charAt(0).toUpperCase() +
        names[names.length - 1].charAt(0).toUpperCase()
      );
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "";
  };

  return (
    <div className={styles.userDropdown}>
      <div className={styles.userAvatar} onClick={toggleMenu}>
        {getInitials(user)}
      </div>
      {menuOpen && (
        <div className={styles.dropdownMenu}>
          <div
            className={styles.dropdownItem}
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
          >
            Logout
          </div>
        </div>
      )}
      <style jsx>{`
        .${styles.userDropdown} {
          position: relative;
          cursor: pointer;
        }
        .${styles.userAvatar} {
          width: 40px;
          height: 40px;
          background-color: #4285f4;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: bold;
        }
        .${styles.dropdownMenu} {
          position: absolute;
          top: 45px;
          right: 0;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2);
          min-width: 150px;
          z-index: 10;
        }
        .${styles.dropdownItem} {
          padding: 10px 15px;
          font-size: 0.95rem;
          cursor: pointer;
          color: #333;
          text-decoration: none;
          display: block;
          transition: background 0.2s ease;
        }
        .${styles.dropdownItem}:hover {
          background: #f7f7f7;
        }
        .${styles.badge} {
          background: #e91e63;
          color: #fff;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.8rem;
          margin-left: 5px;
        }
      `}</style>
    </div>
  );
}
