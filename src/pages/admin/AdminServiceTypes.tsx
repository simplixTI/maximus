import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Wrench,
  Sparkles,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAllServiceTypes,
  useCreateServiceType,
  useUpdateServiceType,
  useDeleteServiceType,
  slugify,
  type ServiceTypeRow,
} from "@/hooks/serviceTypes";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "inactive";

type EditorState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; row: ServiceTypeRow };

// Render a lucide icon by string name; falls back to Wrench.
function IconByName({ name, className }: { name: string | null; className?: string }) {
  const Icon =
    (name &&
      (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
        name
      ]) ||
    Wrench;
  return <Icon className={className} />;
}

const AdminServiceTypes = () => {
  const navigate = useNavigate();
  const listQ = useAllServiceTypes();
  const createMut = useCreateServiceType();
  const updateMut = useUpdateServiceType();
  const deleteMut = useDeleteServiceType();

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [toDelete, setToDelete] = useState<ServiceTypeRow | null>(null);

  const rows = listQ.data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && !r.active) return false;
      if (filter === "inactive" && r.active) return false;
      if (!needle) return true;
      return (
        r.label.toLowerCase().includes(needle) ||
        r.slug.toLowerCase().includes(needle) ||
        (r.icon ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, filter, q]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => r.active).length,
      inactive: rows.filter((r) => !r.active).length,
    }),
    [rows],
  );

  const toggleActive = async (row: ServiceTypeRow) => {
    try {
      await updateMut.mutateAsync({ id: row.id, patch: { active: !row.active } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Toggle failed");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMut.mutateAsync(toDelete.id);
      toast.success(`Deleted "${toDelete.label}"`);
      setToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-16">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-64 overflow-hidden md:block">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -right-16 top-16 h-64 w-64 rounded-full bg-primary/10 blur-[110px]" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-foreground/80 transition-all hover:border-accent/40 hover:text-accent"
              aria-label="Back to admin"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none text-foreground">
                Service <span className="text-gradient-orange">Types</span>
              </h1>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Categories offered to clients when creating a request.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setEditor({ mode: "create" })}
            className="h-10 rounded-xl bg-gradient-orange font-display text-sm font-semibold text-accent-foreground shadow-orange"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </div>

        {/* Controls */}
        <div className="mx-6 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search label, slug, icon…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-xl border-border bg-card pl-9 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {(["all", "active", "inactive"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium capitalize tabular-nums transition-colors",
                  filter === f
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f} <span className="text-[10px] opacity-60">· {counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mx-6 mt-4">
          {listQ.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
              <Sparkles className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="font-display text-sm font-semibold text-foreground">
                {q ? "No matches" : "No service types yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {q
                  ? "Try a different search term or clear the filter."
                  : "Create the first one to make it available in the request flow."}
              </p>
            </div>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
              className="space-y-2"
            >
              <AnimatePresence initial={false}>
                {filtered.map((row) => (
                  <motion.li
                    key={row.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-card/60 p-3 transition-colors",
                      row.active
                        ? "border-border hover:border-accent/40"
                        : "border-border/60 opacity-60 hover:opacity-100",
                    )}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/50">
                      <IconByName name={row.icon} className="h-5 w-5 text-accent" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-foreground">
                        {row.label}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {row.slug}
                        {row.icon ? (
                          <span className="ml-2 rounded bg-background/60 px-1.5 py-0.5 text-[10px]">
                            {row.icon}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <span className="hidden shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground sm:inline-block">
                      #{row.sort_order}
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={row.active}
                        onCheckedChange={() => toggleActive(row)}
                        aria-label={row.active ? "Deactivate" : "Activate"}
                      />
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditor({ mode: "edit", row })}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setToDelete(row)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>

      <ServiceTypeEditor
        state={editor}
        onClose={() => setEditor({ mode: "closed" })}
        onSubmit={async (payload) => {
          try {
            if (editor.mode === "edit") {
              await updateMut.mutateAsync({ id: editor.row.id, patch: payload });
              toast.success(`Updated "${payload.label ?? editor.row.label}"`);
            } else {
              await createMut.mutateAsync({
                slug: payload.slug!,
                label: payload.label!,
                icon: payload.icon ?? null,
                description: payload.description ?? null,
                active: payload.active ?? true,
                sort_order: payload.sort_order ?? nextSortOrder(rows),
              });
              toast.success(`Created "${payload.label}"`);
            }
            setEditor({ mode: "closed" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
          }
        }}
        saving={createMut.isPending || updateMut.isPending}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete this service type?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="text-foreground">"{toDelete?.label}"</span> will be removed
              permanently. Existing service requests that already used this category will keep
              their string value — only the option in the client picker disappears. Consider
              deactivating instead if you may want it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-background text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function nextSortOrder(rows: ServiceTypeRow[]): number {
  return rows.length === 0 ? 10 : Math.max(...rows.map((r) => r.sort_order)) + 10;
}

// -----------------------------------------------------------------------------
// Editor (dialog for create/edit)
// -----------------------------------------------------------------------------

type EditorProps = {
  state: EditorState;
  onClose: () => void;
  onSubmit: (payload: Partial<ServiceTypeRow>) => Promise<void>;
  saving: boolean;
};

const ServiceTypeEditor = ({ state, onClose, onSubmit, saving }: EditorProps) => {
  const isEdit = state.mode === "edit";
  const initial = isEdit ? state.row : null;

  const [label, setLabel] = useState(initial?.label ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [sortOrder, setSortOrder] = useState<string>(
    initial?.sort_order != null ? String(initial.sort_order) : "",
  );
  const [slugTouched, setSlugTouched] = useState(false);

  // Reset local state whenever the dialog opens with different content.
  useEffect(() => {
    if (state.mode === "closed") return;
    if (state.mode === "edit") {
      setLabel(state.row.label);
      setSlug(state.row.slug);
      setIcon(state.row.icon ?? "");
      setDescription(state.row.description ?? "");
      setActive(state.row.active);
      setSortOrder(String(state.row.sort_order));
      setSlugTouched(true);
    } else {
      setLabel("");
      setSlug("");
      setIcon("");
      setDescription("");
      setActive(true);
      setSortOrder("");
      setSlugTouched(false);
    }
  }, [state]);

  const open = state.mode !== "closed";

  const effectiveSlug = slug || slugify(label);
  const valid = label.trim().length >= 2 && /^[a-z0-9-]+$/.test(effectiveSlug);

  const submit = async () => {
    if (!valid) return;
    const payload: Partial<ServiceTypeRow> = {
      label: label.trim(),
      slug: effectiveSlug,
      icon: icon.trim() || null,
      description: description.trim() || null,
      active,
    };
    const parsedOrder = parseInt(sortOrder, 10);
    if (!Number.isNaN(parsedOrder)) payload.sort_order = parsedOrder;
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEdit ? `Edit ${state.row.label}` : "New service type"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Preview strip */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
              <IconByName name={icon || null} className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold text-foreground">
                {label || "New category"}
              </p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">
                {effectiveSlug || "slug-preview"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest",
                active ? "bg-accent/15 text-accent" : "bg-muted/40 text-muted-foreground",
              )}
            >
              {active ? "Active" : "Hidden"}
            </span>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Label
            </Label>
            <Input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. Solar Install"
              className="rounded-xl border-border bg-background/40 text-foreground"
              maxLength={60}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Slug{" "}
              <span className="text-[10px] normal-case text-muted-foreground/70">
                (lowercase, hyphens; auto-generated from label)
              </span>
            </Label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              onBlur={() => setSlugTouched(true)}
              placeholder={slugify(label) || "solar-install"}
              className="rounded-xl border-border bg-background/40 font-mono text-sm text-foreground"
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Icon (lucide name)
              </Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. Sun"
                className="rounded-xl border-border bg-background/40 font-mono text-sm text-foreground"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                Sort order
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="10"
                className="rounded-xl border-border bg-background/40 tabular-nums text-foreground"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short internal note about when to use this category."
              className="min-h-[70px] rounded-xl border-border bg-background/40 text-sm text-foreground"
              maxLength={280}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Active</p>
              <p className="text-[11px] text-muted-foreground">
                Only active types show up in the client request flow.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || saving}
            className="rounded-xl bg-gradient-orange font-display text-sm font-semibold text-accent-foreground shadow-orange disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminServiceTypes;
