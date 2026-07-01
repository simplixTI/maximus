import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Eye,
  ShieldCheck,
  KeyRound,
  MessageCircle,
  Copy,
  Briefcase,
  Users as UsersIcon,
  Wrench,
  Sparkles,
  Radio,
  Mail,
  Phone,
  Clock,
  UserRoundCog,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAdminAllUsers, useChangeUserRole, useAdminResetUserPassword } from "@/hooks/data";
import { sendTransactionalSMS } from "@/lib/sms";
import { sendTransactionalEmail } from "@/lib/email";
import { insertNotification } from "@/hooks/notifications";

type Role = "client" | "provider" | "admin";
type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
};

const ROLE_META: Record<Role, { color: string; icon: typeof UsersIcon; label: string }> = {
  client: { color: "hsl(200, 80%, 60%)", icon: UsersIcon, label: "Client" },
  provider: { color: "hsl(150, 65%, 55%)", icon: Wrench, label: "Provider" },
  admin: { color: "hsl(38, 90%, 55%)", icon: ShieldCheck, label: "Admin" },
};

const fmtInt = new Intl.NumberFormat("en-US");

function initials(name: string | null, email: string | null): string {
  const src = (name?.trim() || email?.split("@")[0] || "U").slice(0, 2);
  return src.toUpperCase();
}
function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const usersQ = useAdminAllUsers();
  const changeRole = useChangeUserRole();
  const resetPw = useAdminResetUserPassword();

  const [filter, setFilter] = useState<"all" | Role>("all");
  const [search, setSearch] = useState("");
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [roleForId, setRoleForId] = useState<string | null>(null);
  const [msgForId, setMsgForId] = useState<string | null>(null);
  const [msgTitle, setMsgTitle] = useState("Update from Maximus");
  const [msgBody, setMsgBody] = useState("");

  const all = (usersQ.data ?? []) as UserRow[];

  const stats = useMemo(() => {
    const s = { all: 0, client: 0, provider: 0, admin: 0, newLast7: 0 };
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    for (const u of all) {
      s.all += 1;
      if (u.role === "client") s.client += 1;
      else if (u.role === "provider") s.provider += 1;
      else if (u.role === "admin") s.admin += 1;
      if (new Date(u.created_at).getTime() > sevenDaysAgo) s.newLast7 += 1;
    }
    return s;
  }, [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (q) {
        const hay = `${u.full_name ?? ""} ${u.email ?? ""} ${u.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, filter, search]);

  const drawerUser = drawerId ? all.find((u) => u.id === drawerId) ?? null : null;
  const roleUser = roleForId ? all.find((u) => u.id === roleForId) ?? null : null;
  const msgUser = msgForId ? all.find((u) => u.id === msgForId) ?? null : null;

  const doChangeRole = async (role: Role) => {
    if (!roleUser) return;
    try {
      await changeRole.mutateAsync({ user_id: roleUser.id, role });
      toast.success(`Role → ${role}`);
      setRoleForId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change role");
    }
  };

  const doReset = async (u: UserRow) => {
    if (!u.email) return toast.error("No email on file");
    try {
      await resetPw.mutateAsync(u.email);
      toast.success(`Reset link sent to ${u.email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reset link");
    }
  };

  const doCopyId = async (u: UserRow) => {
    try {
      await navigator.clipboard.writeText(u.id);
      toast.success("User ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const doSendMessage = async () => {
    if (!msgUser || !msgBody.trim()) return;
    insertNotification({
      user_id: msgUser.id,
      type: "admin_message",
      title: msgTitle,
      body: msgBody,
    });
    if (msgUser.phone) {
      sendTransactionalSMS({ to: msgUser.phone, template: "generic", data: { body: `Maximus: ${msgBody}` } });
    }
    if (msgUser.email) {
      sendTransactionalEmail({
        to: msgUser.email,
        template: "generic",
        subject: msgTitle,
        data: { body: msgBody, name: msgUser.full_name ?? undefined },
      });
    }
    toast.success("Message delivered (SMS + email + in-app)");
    setMsgBody("");
    setMsgForId(null);
  };

  const filterChips: { id: typeof filter; label: string; count: number; tint: string }[] = [
    { id: "all", label: "All", count: stats.all, tint: "hsl(220, 10%, 60%)" },
    { id: "client", label: "Clients", count: stats.client, tint: ROLE_META.client.color },
    { id: "provider", label: "Providers", count: stats.provider, tint: ROLE_META.provider.color },
    { id: "admin", label: "Admins", count: stats.admin, tint: ROLE_META.admin.color },
  ];

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-52 overflow-hidden md:block">
        <div className="absolute -left-16 top-0 h-52 w-52 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -right-16 top-12 h-52 w-52 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              aria-label="Back to Mission Control"
              className="rounded-xl p-2 text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold leading-none text-foreground">
                People <span className="text-gradient-orange">Directory</span>
              </h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {stats.all} total · {stats.newLast7} new this week
              </p>
            </div>
          </div>
          <button
            onClick={() => usersQ.refetch()}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            aria-label="Refresh"
          >
            <Radio className={`h-4 w-4 ${usersQ.isFetching ? "animate-pulse text-accent" : ""}`} />
          </button>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-3 gap-2 px-6"
        >
          {[
            { label: "Clients", value: stats.client, icon: UsersIcon, tint: ROLE_META.client.color },
            { label: "Providers", value: stats.provider, icon: Wrench, tint: ROLE_META.provider.color },
            { label: "Admins", value: stats.admin, icon: ShieldCheck, tint: ROLE_META.admin.color },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-xl border border-border bg-card/60 p-3"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${s.tint}20` }}
                >
                  <s.icon className="h-3.5 w-3.5" style={{ color: s.tint }} />
                </div>
                {stats.newLast7 > 0 && i === 0 && (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                    +{stats.newLast7}
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-lg font-bold tabular-nums text-foreground">
                {fmtInt.format(s.value)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mx-6 mt-4 flex flex-col gap-3">
          <div className="scrollbar-none flex gap-2 overflow-x-auto">
            {filterChips.map((c) => {
              const active = filter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground"
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      background: active ? "hsl(0 0% 100% / 0.15)" : `${c.tint}20`,
                      color: active ? "hsl(var(--background))" : c.tint,
                    }}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 px-6">
          {usersQ.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-card/40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
              <UsersIcon className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">No users match</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different filter or clear the search
              </p>
            </div>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              className="space-y-2"
            >
              {filtered.map((u) => {
                const meta = ROLE_META[u.role];
                return (
                  <motion.li
                    key={u.id}
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                    }}
                  >
                    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 transition-all hover:border-accent/30">
                      <button
                        onClick={() => setDrawerId(u.id)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <div
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 font-display text-sm font-bold"
                          style={{
                            background: `${meta.color}15`,
                            borderColor: `${meta.color}40`,
                            color: meta.color,
                          }}
                        >
                          {initials(u.full_name, u.email)}
                          <span
                            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background"
                            style={{ background: meta.color }}
                          >
                            <meta.icon className="h-2 w-2 text-background" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {u.full_name || u.email?.split("@")[0] || "Unnamed"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {u.email ?? u.phone ?? "no contact info"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span
                              className="rounded-full px-1.5 py-0.5 font-medium capitalize"
                              style={{ background: `${meta.color}18`, color: meta.color }}
                            >
                              {meta.label}
                            </span>
                            <span>· {relTime(u.created_at)}</span>
                          </div>
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="rounded-lg p-1.5 text-muted-foreground opacity-70 hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 group-hover:opacity-100"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 border-border bg-card">
                          <DropdownMenuItem onClick={() => setDrawerId(u.id)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRoleForId(u.id)}>
                            <UserRoundCog className="mr-2 h-3.5 w-3.5" /> Change role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setMsgForId(u.id)}>
                            <MessageCircle className="mr-2 h-3.5 w-3.5" /> Send message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doReset(u)} disabled={!u.email}>
                            <KeyRound className="mr-2 h-3.5 w-3.5" /> Send reset link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/jobs?client=${u.id}`)}>
                            <Briefcase className="mr-2 h-3.5 w-3.5" /> View bookings
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => doCopyId(u)}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> Copy user ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </div>
      </div>

      <Sheet open={!!drawerId} onOpenChange={(v) => !v && setDrawerId(null)}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto border-l-border bg-background p-0">
          {drawerUser && (
            <>
              <SheetHeader className="border-b border-border bg-card/40 px-6 py-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 font-display text-lg font-bold"
                    style={{
                      background: `${ROLE_META[drawerUser.role].color}15`,
                      borderColor: `${ROLE_META[drawerUser.role].color}40`,
                      color: ROLE_META[drawerUser.role].color,
                    }}
                  >
                    {initials(drawerUser.full_name, drawerUser.email)}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="truncate font-display text-lg font-bold text-foreground">
                      {drawerUser.full_name || drawerUser.email?.split("@")[0] || "Unnamed"}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground capitalize">{drawerUser.role}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-4 px-6 py-5">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contact</p>
                  {drawerUser.email && (
                    <a
                      href={`mailto:${drawerUser.email}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 text-sm text-foreground transition-colors hover:border-accent/40"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{drawerUser.email}</span>
                    </a>
                  )}
                  {drawerUser.phone && (
                    <a
                      href={`tel:${drawerUser.phone}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 text-sm text-foreground transition-colors hover:border-accent/40"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{drawerUser.phone}</span>
                    </a>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account</p>
                  <div className="rounded-xl border border-border bg-card/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">User ID</span>
                      <button
                        onClick={() => doCopyId(drawerUser)}
                        className="inline-flex items-center gap-1 text-foreground hover:text-accent"
                      >
                        <span className="font-mono tabular-nums">{drawerUser.id.slice(0, 8)}…</span>
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Joined</span>
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Clock className="h-3 w-3" />
                        {joinedLabel(drawerUser.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      setRoleForId(drawerUser.id);
                      setDrawerId(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border bg-transparent text-foreground"
                  >
                    <UserRoundCog className="h-3.5 w-3.5" /> Role
                  </Button>
                  <Button
                    onClick={() => {
                      setMsgForId(drawerUser.id);
                      setDrawerId(null);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border bg-transparent text-foreground"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </Button>
                  <Button
                    onClick={() => doReset(drawerUser)}
                    disabled={!drawerUser.email || resetPw.isPending}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border bg-transparent text-foreground"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Reset PW
                  </Button>
                  <Button
                    onClick={() => navigate(`/admin/jobs?client=${drawerUser.id}`)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-border bg-transparent text-foreground"
                  >
                    <Briefcase className="h-3.5 w-3.5" /> Jobs
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!roleForId} onOpenChange={(v) => !v && setRoleForId(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Change role</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Promoting someone to admin gives full platform access. Choose carefully.
            </p>
          </DialogHeader>
          <div className="space-y-1.5">
            {(Object.keys(ROLE_META) as Role[]).map((r) => {
              const meta = ROLE_META[r];
              const current = roleUser?.role === r;
              return (
                <button
                  key={r}
                  onClick={() => doChangeRole(r)}
                  disabled={current || changeRole.isPending}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-left transition-all hover:border-accent/40 disabled:opacity-40"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${meta.color}20` }}
                  >
                    <meta.icon className="h-4 w-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {r === "client" && "Books services"}
                      {r === "provider" && "Fulfills jobs"}
                      {r === "admin" && "Full ops access"}
                    </p>
                  </div>
                  {current && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      current
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!msgForId} onOpenChange={(v) => !v && setMsgForId(null)}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Send message
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Delivers via SMS, email, and in-app notification.
            </p>
          </DialogHeader>
          <div className="space-y-2">
            <input
              value={msgTitle}
              onChange={(e) => setMsgTitle(e.target.value)}
              placeholder="Title"
              className="h-9 w-full rounded-lg border border-border bg-secondary/40 px-3 text-sm text-foreground focus:border-accent focus:outline-none"
            />
            <Textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Message body…"
              className="min-h-[100px] rounded-lg border-border bg-secondary/40 text-sm text-foreground"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMsgForId(null)}
                className="border-border bg-transparent text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={doSendMessage}
                disabled={!msgBody.trim()}
                className="gap-1.5 bg-gradient-orange text-accent-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
