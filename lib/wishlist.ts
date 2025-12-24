export type WishlistItem = {
  id: string;
  name: string;
  price?: number;
  image?: string;
};

const STORAGE_PREFIX = "rr_wishlist";

const safeParse = (raw: string | null): WishlistItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getWishlistKey = (userId?: string | null) =>
  userId ? `${STORAGE_PREFIX}_${userId}` : `${STORAGE_PREFIX}_guest`;

export const getWishlist = (userId?: string | null): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(getWishlistKey(userId)));
};

const notify = (items: WishlistItem[], key: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("wishlist:change", { detail: { items, key } })
  );
};

export const setWishlist = (items: WishlistItem[], userId?: string | null) => {
  if (typeof window === "undefined") return;
  const key = getWishlistKey(userId);
  localStorage.setItem(key, JSON.stringify(items));
  notify(items, key);
};

export const toggleWishlist = (
  item: WishlistItem,
  userId?: string | null
): WishlistItem[] => {
  const current = getWishlist(userId);
  const exists = current.some((entry) => entry.id === item.id);
  const next = exists
    ? current.filter((entry) => entry.id !== item.id)
    : [item, ...current];
  setWishlist(next, userId);
  return next;
};

export const removeWishlistItem = (
  id: string,
  userId?: string | null
): WishlistItem[] => {
  const next = getWishlist(userId).filter((entry) => entry.id !== id);
  setWishlist(next, userId);
  return next;
};

export const clearWishlist = (userId?: string | null) => {
  setWishlist([], userId);
};

export const isWishlisted = (id: string, userId?: string | null): boolean => {
  return getWishlist(userId).some((entry) => entry.id === id);
};
