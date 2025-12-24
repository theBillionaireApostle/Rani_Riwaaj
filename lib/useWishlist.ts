"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WishlistItem,
  getWishlist,
  getWishlistKey,
  toggleWishlist,
  removeWishlistItem,
  clearWishlist,
  setWishlist,
} from "./wishlist";

type UseWishlistOptions = {
  userId?: string | null;
  enabled?: boolean;
  apiBase?: string;
};

const defaultApiBase =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.NEXT_PUBLIC_API_URL ??
  "";

export const useWishlist = (options: UseWishlistOptions = {}) => {
  const { userId, enabled = true, apiBase = defaultApiBase } = options;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const storageKey = useMemo(() => getWishlistKey(userId), [userId]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }

    if (userId) {
      const userItems = getWishlist(userId);
      if (userItems.length === 0) {
        const guestItems = getWishlist();
        if (guestItems.length > 0) {
          setWishlist(guestItems, userId);
          clearWishlist();
          setItems(guestItems);
        } else {
          setItems(userItems);
        }
      } else {
        setItems(userItems);
      }
    } else {
      setItems(getWishlist());
    }

    const onChange = (event: Event) => {
      if (event.type === "storage") {
        const storageEvent = event as StorageEvent;
        if (storageEvent.key !== storageKey) return;
        setItems(getWishlist(userId));
        return;
      }

      const detail = (event as CustomEvent).detail as
        | { items?: WishlistItem[]; key?: string }
        | undefined;
      if (detail?.key && detail.key !== storageKey) return;
      if (detail?.items) {
        setItems(detail.items);
        return;
      }
      setItems(getWishlist(userId));
    };

    window.addEventListener("wishlist:change", onChange);
    window.addEventListener("storage", onChange);

    return () => {
      window.removeEventListener("wishlist:change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [enabled, storageKey, userId]);

  const persist = async (nextItems: WishlistItem[]) => {
    if (!apiBase || !userId) return;
    try {
      await fetch(`${apiBase}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, items: nextItems }),
      });
    } catch {
      // ignore sync errors; local state remains
    }
  };

  useEffect(() => {
    if (!enabled || !userId || !apiBase) return;
    let active = true;

    const sync = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/wishlist?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const remoteItems = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const localItems = getWishlist(userId);
        const nextItems =
          remoteItems.length > 0 ? remoteItems : localItems;

        setWishlist(nextItems, userId);
        if (active) setItems(nextItems);

        if (remoteItems.length === 0 && localItems.length > 0) {
          void persist(localItems);
        }
      } catch {
        // ignore sync errors
      }
    };

    void sync();
    return () => {
      active = false;
    };
  }, [apiBase, enabled, userId]);

  const has = (id: string) => items.some((entry) => entry.id === id);

  const toggle = (item: WishlistItem) => {
    if (!userId) return items;
    const next = toggleWishlist(item, userId);
    setItems(next);
    void persist(next);
    return next;
  };

  const remove = (id: string) => {
    if (!userId) return items;
    const next = removeWishlistItem(id, userId);
    setItems(next);
    void persist(next);
    return next;
  };

  const clear = () => {
    if (!userId) return;
    clearWishlist(userId);
    setItems([]);
    void persist([]);
  };

  return { items, count: items.length, has, toggle, remove, clear };
};
