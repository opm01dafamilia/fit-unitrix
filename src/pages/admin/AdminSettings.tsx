import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Globe } from "lucide-react";

const AdminSettings = () => {
  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">Configurações</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Autenticação
            </CardTitle>
            <Badge variant="default">Ativo</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Login e cadastro próprios via Supabase Auth. Sem dependência de SSO externo.</p>
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
