"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AssociationJobRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [active, router]);
  return active ? <span className="field-help" aria-live="polite">Refreshing progress every 10 seconds while jobs are active.</span> : null;
}
