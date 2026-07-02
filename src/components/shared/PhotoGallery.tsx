import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, ImageIcon, Download } from "lucide-react";
import { signedUrl } from "@/hooks/upload";

type Bucket = "avatars" | "provider-docs" | "job-photos";

interface Props {
  paths: string[];
  bucket?: Bucket;
  label?: string;
  compact?: boolean;
}

const PhotoGallery = ({ paths, bucket = "job-photos", label, compact = false }: Props) => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      paths.map(async (p) => {
        try {
          const u = await signedUrl(bucket, p, 3600);
          return [p, u] as const;
        } catch {
          return [p, ""] as const;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const [p, u] of pairs) if (u) map[p] = u;
      setUrls(map);
    });
    return () => {
      cancelled = true;
    };
  }, [paths, bucket]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowLeft")
        setOpenIndex((i) => (i === null ? null : (i - 1 + paths.length) % paths.length));
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? null : (i + 1) % paths.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, paths.length]);

  if (paths.length === 0) return null;

  const currentPath = openIndex !== null ? paths[openIndex] : null;
  const currentUrl = currentPath ? urls[currentPath] : null;
  const thumbSize = compact ? "h-14 w-14" : "h-20 w-20";
  const visible = compact ? paths.slice(0, 3) : paths.slice(0, 5);
  const overflow = paths.length - visible.length;

  return (
    <>
      {label && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-accent/70">
          <ImageIcon className="h-3 w-3" />
          <span>{label}</span>
          <span className="text-muted-foreground/60">· {paths.length}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {visible.map((p, i) => (
          <button
            key={p}
            onClick={() => setOpenIndex(i)}
            className={`${thumbSize} group relative shrink-0 overflow-hidden rounded-xl border border-accent/25 bg-secondary/40 shadow-[0_2px_10px_-4px_hsl(38,90%,55%,0.15)] transition-all hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-[0_8px_24px_-8px_hsl(38,90%,55%,0.35)]`}
            aria-label={`Open photo ${i + 1}`}
          >
            {urls[p] ? (
              <img
                src={urls[p]}
                alt={`Attached ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
        {overflow > 0 && (
          <button
            onClick={() => setOpenIndex(visible.length)}
            className={`${thumbSize} flex shrink-0 items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/[0.06] text-xs font-semibold text-accent transition-all hover:border-accent/70 hover:bg-accent/10`}
            aria-label={`See ${overflow} more`}
          >
            +{overflow}
          </button>
        )}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/90 backdrop-blur transition-colors hover:border-accent/50 hover:text-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur">
            <span className="font-mono text-xs tabular-nums text-accent">{openIndex + 1}</span>
            <span className="mx-1 text-white/40">/</span>
            <span className="font-mono text-xs tabular-nums text-white/60">{paths.length}</span>
          </div>

          {paths.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i === null ? null : (i - 1 + paths.length) % paths.length));
              }}
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur transition-colors hover:border-accent/50 hover:text-accent"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {paths.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) => (i === null ? null : (i + 1) % paths.length));
              }}
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/80 backdrop-blur transition-colors hover:border-accent/50 hover:text-accent"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="max-h-[90vh] max-w-[92vw] px-4" onClick={(e) => e.stopPropagation()}>
            {currentUrl ? (
              <img
                src={currentUrl}
                alt={`Photo ${(openIndex ?? 0) + 1}`}
                className="max-h-[90vh] max-w-full rounded-2xl border border-accent/20 object-contain shadow-[0_30px_100px_-30px_hsl(38,90%,55%,0.35)]"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <ImageIcon className="h-8 w-8 text-white/30" />
              </div>
            )}
          </div>

          {currentUrl && (
            <a
              href={currentUrl}
              download
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-black/60 px-4 py-2 text-xs font-semibold text-accent backdrop-blur transition-colors hover:bg-accent/10"
            >
              <Download className="h-3 w-3" />
              Download original
            </a>
          )}
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
