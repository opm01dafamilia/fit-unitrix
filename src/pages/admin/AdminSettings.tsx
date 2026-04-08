import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Globe, ClipboardList } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/components/ui/sonner";

const AdminSettings = () => {
  const { isPersonalEnabled, toggleSetting, loading } = useAppSettings();
  const [personalOn, setPersonalOn] = useState(true);

  useEffect(() => {
    if (!loading) setPersonalOn(isPersonalEnabled);
  }, [loading, isPersonalEnabled]);

  const handleTogglePersonal = async (v: boolean) => {
    setPersonalOn(v);
    const ok = await toggleSetting("personal_enabled", v);
    if (ok) {
      toast.success(v ? "Aba Personal ativada!" : "Aba Personal desativada!");
    } else {
      setPersonalOn(!v);
      toast.error("Erro ao alterar configuração.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Configurações</h1>

      <div className="space-y-4">
        {/* Personal toggle */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Aba Personal
            </CardTitle>
            <Switch checked={personalOn} onCheckedChange={handleTogglePersonal} disabled={loading} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {personalOn
                ? "A aba Personal está ativa e disponível para usuários autorizados."
                : "A aba Personal está desativada. Usuários verão uma mensagem de indisponibilidade."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Autenticação
            </CardTitle>
            <Badge variant="default">Ativo</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Login e cadastro próprios. Sem dependência de SSO externo.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" /> Banco de Dados
            </CardTitle>
            <Badge variant="default">Conectado</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">PostgreSQL via Lovable Cloud com RLS habilitado em todas as tabelas.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Webhook Kiwify
            </CardTitle>
            <Badge variant="default">Configurado</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Edge function pronta para receber eventos de compra, reembolso, cancelamento e renovação.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
