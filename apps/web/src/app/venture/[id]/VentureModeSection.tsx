"use client";

import { useEffect, useState, type ReactNode } from "react";

type VentureMode = "simple" | "pro";

export function VentureModeSection({ mode, children, className = "" }: { mode: VentureMode; children: ReactNode; className?: string }) {
  const [current, setCurrent] = useState<VentureMode>("simple");

  useEffect(() => {
    const saved = window.localStorage.getItem("venture-ui-mode");
    if (saved === "pro") setCurrent("pro");
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<VentureMode>).detail;
      if (detail === "simple" || detail === "pro") setCurrent(detail);
    };
    window.addEventListener("venture-mode-change", handler);
    return () => window.removeEventListener("venture-mode-change", handler);
  }, []);

  if (current !== mode) return null;
  return <div className={className}>{children}</div>;
}
