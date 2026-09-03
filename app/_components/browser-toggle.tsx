"use client";

import { useEffect, useState } from "react";
import { GlobeIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrowserToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/browser")
      .then((r) => r.json())
      .then((data) => setEnabled(data?.enabled ?? false))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await fetch("/api/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
    } catch {
      // revert on failure
      setEnabled(!next);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Browser enabled"
      onClick={() => void toggle()}
      disabled={loading}
      className={cn(
        "pointer-events-auto flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors",
        "border-border bg-background/80 backdrop-blur hover:bg-accent",
        enabled && "border-green-500/50 bg-green-500/10 text-green-600",
        className,
      )}
      title={enabled ? "Браузер включён" : "Браузер выключен"}
    >
      {loading ? (
        <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
      ) : (
        <GlobeIcon className={cn("size-3.5", enabled ? "text-green-600" : "text-muted-foreground")} />
      )}
      <span className="relative inline-flex h-3.5 w-6 items-center">
        <span
          className={cn(
            "inline-block h-2 w-2 transform rounded-full bg-current transition-transform",
            enabled ? "translate-x-3" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}