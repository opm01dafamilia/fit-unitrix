import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type UserRow = {
  user_id: string;
  full_name: string | null;
  created_at: string;
  sub_status: string;
  plan_type: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("user_subscriptions").select("user_id, status, plan_type");

      const subMap = new Map((subs || []).map((s) => [s.user_id, s]));
      const rows: UserRow[] = (profiles || []).map((p) => {
        const sub = subMap.get(p.user_id);
        return {
          user_id: p.user_id,
          full_name: p.full_name,
          created_at: p.created_at,
          sub_status: sub?.status || "sem plano",
          plan_type: sub?.plan_type || "—",
        };
      });
      setUsers(rows);
      setLoading(false);
    };
    fetch();
  }, []);

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "trial") return "secondary";
    if (s === "canceled" || s === "expired") return "destructive";
    return "outline";
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Usuários</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lista de usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "Sem nome"}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(u.sub_status)}>{u.sub_status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{u.plan_type}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
