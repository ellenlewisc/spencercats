"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCats } from "@/lib/api-client";
import type { CatImage } from "@/lib/types";

type Status = "loading" | "idle" | "error";

export function useCatFeed() {
  const [cats, setCats] = useState<CatImage[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    inFlightRef.current = true;
    setStatus("loading");
    try {
      const page = await fetchCats(cursorRef.current);
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.nextCursor !== null;
      setHasMore(hasMoreRef.current);
      setCats((prev) => {
        const seen = new Set(prev.map((cat) => cat.key));
        return [...prev, ...page.cats.filter((cat) => !seen.has(cat.key))];
      });
      setStatus("idle");
    } catch {
      setStatus("error");
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    hasMoreRef.current = true;
    setHasMore(true);
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  // Recreated per status change so a sentinel that stays on screen after a load still triggers the next page.
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || status !== "idle") return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) void loadMore();
        },
        { rootMargin: "800px 0px" },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMore, status],
  );

  const addCat = useCallback((cat: CatImage) => setCats((prev) => [cat, ...prev]), []);

  const removeCat = useCallback((key: string) => setCats((prev) => prev.filter((cat) => cat.key !== key)), []);

  const setCaption = useCallback(
    (key: string, caption: string) =>
      setCats((prev) => prev.map((cat) => (cat.key === key ? { ...cat, caption } : cat))),
    [],
  );

  return { cats, status, hasMore, loadMore, retry, sentinelRef, addCat, removeCat, setCaption };
}
