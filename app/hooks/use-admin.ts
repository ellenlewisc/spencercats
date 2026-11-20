"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { fetchIsAdmin } from "@/lib/api-client";
import { getBrowserClient } from "@/lib/supabase-browser";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { data } = getBrowserClient().auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        return;
      }
      // Deferred because Supabase deadlocks if auth calls run inside this callback.
      setTimeout(() => {
        fetchIsAdmin()
          .then((admin) => !cancelled && setIsAdmin(admin))
          .catch(() => !cancelled && setIsAdmin(false));
      }, 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserClient().auth.signOut();
  }, []);

  return { user, isAdmin, signOut };
}
