"use client";

import { useMemo, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types/wallpaper";

type CollectionToolsProps = {
  collectionsEndpoint: string;
};

type BatchArchiveProps = {
  archiveEndpoint: string;
  collectionSlug: string;
  wallpapers: Array<Pick<Wallpaper, "id" | "slug" | "title">>;
};

export function InsPicksCollectionTools({
  collectionsEndpoint,
}: CollectionToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [nativeName, setNativeName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [createdHref, setCreatedHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitCollection() {
    setMessage(null);
    setCreatedHref(null);

    startTransition(async () => {
      const response = await fetch(collectionsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          nativeName,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.error ?? "Failed to create collection.");
        return;
      }

      const href = payload?.data?.collection?.href;
      setMessage("Collection created. Uploads will use its own R2 prefix.");
      setCreatedHref(typeof href === "string" ? href : null);
      setLabel("");
      setNativeName("");
    });
  }

  return (
    <div className="glass-surface-soft max-w-xl p-4">
      <button
        className="glass-control inline-flex min-h-[42px] items-center justify-center px-5 py-2 text-[10px] uppercase tracking-[0.24em] text-ink transition duration-hover"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        New person set
      </button>

      {isOpen ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            className="glass-field min-h-[42px] px-4 text-sm outline-none"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="English name"
            value={label}
          />
          <input
            className="glass-field min-h-[42px] px-4 text-sm outline-none"
            onChange={(event) => setNativeName(event.target.value)}
            placeholder="中文 / native name"
            value={nativeName}
          />
          <button
            className={cn(
              "glass-primary min-h-[42px] px-5 text-[10px] uppercase tracking-[0.24em]",
              isPending || !label.trim() ? "opacity-60" : "",
            )}
            disabled={isPending || !label.trim()}
            onClick={submitCollection}
            type="button"
          >
            Create
          </button>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs leading-6 text-muted">
          {message}
          {createdHref ? (
            <>
              {" "}
              <a className="text-red underline" href={createdHref}>
                Open set
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function InsPicksBatchArchive({
  archiveEndpoint,
  collectionSlug,
  wallpapers,
}: BatchArchiveProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    wallpapers.map((wallpaper) => wallpaper.id),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const allSelected = selectedIds.length === wallpapers.length;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function downloadSelectedArchive() {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(archiveEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection: collectionSlug,
          wallpaperIds: selectedIds,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setMessage(payload?.error ?? "Failed to package selected photos.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${collectionSlug}-selected.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (!wallpapers.length) {
    return null;
  }

  return (
    <div className="glass-surface-soft mb-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          className="glass-control px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
          onClick={() =>
            setSelectedIds(allSelected ? [] : wallpapers.map((wallpaper) => wallpaper.id))
          }
          type="button"
        >
          {allSelected ? "Clear" : "Select all"}
        </button>
        <button
          className="glass-primary px-5 py-2 text-[10px] uppercase tracking-[0.24em]"
          disabled={isPending || selectedIds.length === 0}
          onClick={downloadSelectedArchive}
          type="button"
        >
          Package selected ({selectedIds.length})
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {wallpapers.map((wallpaper) => (
          <label
            className="glass-chip flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-muted"
            key={wallpaper.id}
          >
            <input
              checked={selectedSet.has(wallpaper.id)}
              onChange={() => toggle(wallpaper.id)}
              type="checkbox"
            />
            <span className="truncate">{wallpaper.title}</span>
          </label>
        ))}
      </div>
      {message ? <p className="mt-3 text-xs text-red">{message}</p> : null}
    </div>
  );
}
