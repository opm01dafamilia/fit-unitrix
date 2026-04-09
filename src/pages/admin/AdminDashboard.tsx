import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Clock, XCircle, DollarSign, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    trialUsers: 0,
    canceledUsers: 0,
    estimatedRevenue: 0,
    lastWebhookEvent: null as string | null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, subsRes, webhookRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_subscriptions").select("status"),
        supabase.from("webhook_logs").select("event_type, created_at").order("created_at", { ascending: false }).limit(1),
      ]);

      const subs = subsRes.data || [];
      const active = subs.filter((s) => s.status === "active").length;
      const trial = subs.filter((s) => s.status === "trial").length;
      const canceled = subs.filter((s) => s.status === "canceled" || s.status === "expired").length;

      setStats({
        totalUsers: profilesRes.count || 0,
        activeSubscriptions: active,
        trialUsers: trial,
        canceledUsers: canceled,
        estimatedRevenue: active * 19.9,
        lastWebhookEvent: webhookRes.data?.[0]?.created_at
          ? new Date(webhookRes.data[0].created_at).toLocaleString("pt-BR")
          : "Nenhum evento",
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total de Usuários", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Assinaturas Ativas", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary" },
    { label: "Usuários em Trial", value: stats.trialUsers, icon: Clock, color: "text-yellow-400" },
    { label: "Cancelados", value: stats.canceledUsers, icon: XCircle, color: "text-destructive" },
    { label: "Receita Estimada", value: `R$ ${stats.estimatedRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Dashboard Administrativo</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
