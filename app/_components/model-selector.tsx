"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ChevronDownIcon, CpuIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AgentModel = {
  id: string;
  name: string;
  context: string;
  provider: "zen" | "openrouter";
  desc: string;
};

const PROVIDER_LABELS: Record<AgentModel["provider"], string> = {
  zen: "OpenCode Zen",
  openrouter: "OpenRouter",
};

export function ModelSelector({ className }: { className?: string }) {
  const [models, setModels] = useState<AgentModel[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/model")
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models ?? []);
        setCurrentId(data.current?.id ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = models.find((m) => m.id === currentId);

  const selectModel = async (id: string) => {
    if (id === currentId || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: id }),
      });
      if (res.ok) {
        setCurrentId(id);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignored
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className={cn("gap-1 text-muted-foreground", className)} disabled>
        <RefreshCwIcon className="size-4 animate-spin" />
        Загрузка моделей…
      </Button>
    );
  }

  const zenModels = models.filter((m) => m.provider === "zen");
  const openrouterModels = models.filter((m) => m.provider === "openrouter");

  const renderModel = (model: AgentModel) => (
    <DropdownMenuItem
      key={model.id}
      disabled={saving}
      onSelect={() => void selectModel(model.id)}
      className={cn(
        "flex flex-col items-start gap-0.5 py-2 pr-8",
        model.id === currentId && "bg-accent",
      )}
    >
      <span className="flex w-full items-center gap-2 text-sm">
        <span className="flex-1 truncate font-medium">{model.name}</span>
        {model.id === currentId && <CheckIcon className="size-3.5 text-primary" />}
      </span>
      <span className="flex w-full items-center gap-1.5 pl-0 text-xs text-muted-foreground">
        <span className="truncate">{model.desc}</span>
        {model.context !== "—" && (
          <span className="shrink-0">· {model.context} context</span>
        )}
      </span>
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5", className)}>
          <CpuIcon className="size-4 text-primary" />
          <span className="max-w-44 truncate font-medium">
            {current ? current.name : "Выбор модели"}
          </span>
          {current && current.context !== "—" && (
            <Badge variant="secondary" className="ml-0.5 px-1.5 text-[10px]">
              {current.context}
            </Badge>
          )}
          {saved ? <CheckIcon className="size-3.5 text-green-500" /> : <ChevronDownIcon className="size-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CpuIcon className="size-3.5" /> Выбери модель ИИ
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {zenModels.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {PROVIDER_LABELS.zen} (без ключа)
            </DropdownMenuLabel>
            {zenModels.map(renderModel)}
            <DropdownMenuSeparator />
          </>
        )}
        {openrouterModels.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {PROVIDER_LABELS.openrouter}
            </DropdownMenuLabel>
            {openrouterModels.map(renderModel)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}