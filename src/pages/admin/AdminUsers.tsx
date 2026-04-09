import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Eye, MoreHorizontal, ShieldCheck, ShieldOff, Gift, Crown, XCircle, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type UserRow = {
  user_id: string;
  full_name: string | null;
  email?: string;
  created_at: string;
  sub_id: string | null;
  sub_status: string;
  plan_type: string;
  started_at: string | null;
  expires_at: string | null;
  roles: string[];
};

type AdminContext = { isAdminMaster: boolean; isAdminViewer: boolean };

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "trial", label: "Trial" },
  { value: "canceled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
  { value: "pending", label: "Pendente" },
  { value: "lifetime", label: "Vitalício" },
  { value: "refunded", label: "Reembolsado" },
  { value: "chargedback", label: "Chargeback" },
];

const PLAN_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
  { value: "personal_pro", label: "Personal Pro" },
  { value: "personal_elite", label: "Personal Elite" },
];

const AdminUsers = () => {
  const { isAdminMaster } = useOutletContext<AdminContext>();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, created_at")
      .order("created_at", { ascending: false });

    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, status, plan_type, started_at, expires_at");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const subMap = new Map((subs || []).map((s) => [s.user_id, s]));
    const roleMap = new Map<string, string[]>();
    (roles || []).forEach((r: any) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const rows: UserRow[] = (profiles || []).map((p) => {
      const sub = subMap.get(p.user_id);
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        created_at: p.created_at,
        sub_id: sub?.id || null,
        sub_status: sub?.status || "sem plano",
        plan_type: sub?.plan_type || "—",
        started_at: sub?.started_at || null,
        expires_at: sub?.expires_at || null,
        roles: roleMap.get(p.user_id) || [],
      };
    });
    setUsers(rows);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const statusColor = (s: string) => {
    if (s === "active" || s === "lifetime") return "default";
    if (s === "trial") return "secondary";
    if (s === "canceled" || s === "expired" || s === "refunded" || s === "chargedback") return "destructive";
    return "outline";
  };

  const openEdit = (u: UserRow) => {
    setSelectedUser(u);
    setEditStatus(u.sub_status === "sem plano" ? "trial" : u.sub_status);
    setEditPlan(u.plan_type === "—" ? "individual" : u.plan_type);
    setEditStartedAt(u.started_at ? u.started_at.slice(0, 16) : "");
    setEditExpiresAt(u.expires_at ? u.expires_at.slice(0, 16) : "");
  };

  const saveChanges = async () => {
    if (!selectedUser) return;
    setSaving(true);

    const subData = {
      status: editStatus,
      plan_type: editPlan,
      started_at: editStartedAt ? new Date(editStartedAt).toISOString() : new Date().toISOString(),
      expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (selectedUser.sub_id) {
      const res = await supabase
        .from("user_subscriptions")
        .update(subData)
        .eq("id", selectedUser.sub_id);
      error = res.error;
    } else {
      const res = await supabase
        .from("user_subscriptions")
        .insert({ ...subData, user_id: selectedUser.user_id });
      error = res.error;
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Alterações salvas com sucesso");
      setSelectedUser(null);
      fetchUsers();
    }
    setSaving(false);
  };

  const quickAction = async (userId: string, action: string) => {
    const now = new Date().toISOString();
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    let subData: any = {};
    switch (action) {
      case "trial":
        subData = { status: "trial", expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), updated_at: now };
        break;
      case "lifetime":
        subData = { status: "lifetime", plan_type: "individual", expires_at: null, updated_at: now };
        break;
      case "cancel":
        subData = { status: "canceled", updated_at: now };
        break;
      default:
        return;
    }

    let error;
    if (user.sub_id) {
      const res = await supabase.from("user_subscriptions").update(subData).eq("id", user.sub_id);
      error = res.error;
    } else {
      const res = await supabase.from("user_subscriptions").insert({ ...subData, user_id: userId, started_at: now });
      error = res.error;
    }

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      const labels: Record<string, string> = { trial: "Trial de 7 dias liberado", lifetime: "Acesso vitalício concedido", cancel: "Acesso cancelado" };
      toast.success(labels[action] || "Ação executada");
      fetchUsers();
    }
  };

  const toggleAdmin = async (userId: string, hasAdmin: boolean) => {
    if (hasAdmin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin_master");
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Admin removido"); fetchUsers(); }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin_master" });
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Admin definido"); fetchUsers(); }
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q)) || u.user_id.toLowerCase().includes(q);
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Usuários</h1>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="shrink-0">{filtered.length} usuário(s)</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lista de usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Cadastro</TableHead>
                    {isAdminMaster && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const hasAdminRole = u.roles.some((r) => r === "admin" || r === "admin_master");
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium">{u.full_name || "Sem nome"}</TableCell>
                        <TableCell>
                          <Badge variant={statusColor(u.sub_status)}>{u.sub_status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{u.plan_type}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.length === 0 && <span className="text-xs text-muted-foreground">user</span>}
                            {u.roles.map((r) => (
                              <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        {isAdminMaster && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => openEdit(u)}>
                                  <Eye className="w-4 h-4 mr-2" /> Ver / Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => quickAction(u.user_id, "trial")}>
                                  <Gift className="w-4 h-4 mr-2" /> Liberar Trial 7d
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => quickAction(u.user_id, "lifetime")}>
                                  <Crown className="w-4 h-4 mr-2" /> Acesso Vitalício
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => quickAction(u.user_id, "cancel")} className="text-destructive">
                                  <XCircle className="w-4 h-4 mr-2" /> Cancelar Acesso
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleAdmin(u.user_id, hasAdminRole)}>
                                  {hasAdminRole ? (
                                    <><ShieldOff className="w-4 h-4 mr-2" /> Remover Admin</>
                                  ) : (
                                    <><ShieldCheck className="w-4 h-4 mr-2" /> Definir Admin</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="font-medium">{selectedUser.full_name || "Sem nome"}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="text-xs font-mono text-muted-foreground break-all">{selectedUser.user_id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Roles</Label>
                <div className="flex gap-1 mt-1">
                  {selectedUser.roles.length === 0 && <Badge variant="outline">user</Badge>}
                  {selectedUser.roles.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Plano</Label>
                  <Select value={editPlan} onValueChange={setEditPlan}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="datetime-local"
                    value={editStartedAt}
                    onChange={(e) => setEditStartedAt(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Expiração</Label>
                  <Input
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={saveChanges} disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
