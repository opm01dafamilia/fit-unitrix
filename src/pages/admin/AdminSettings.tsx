import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Globe, ClipboardList } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "@/components/ui/sonner";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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

      <Accordion type="multiple" className="space-y-3">
        {/* Personal toggle */}
        <AccordionItem value="personal" className="border-none rounded-xl overflow-hidden bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Aba Personal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {personalOn
                  ? "A aba Personal está ativa e disponível para usuários autorizados."
                  : "A aba Personal está desativada. Usuários verão uma mensagem de indisponibilidade."}
              </p>
              <Switch checked={personalOn} onCheckedChange={handleTogglePersonal} disabled={loading} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="auth" className="border-none rounded-xl overflow-hidden bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Autenticação</span>
              <Badge variant="default" className="ml-2">Ativo</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground">Login e cadastro próprios. Sem dependência de SSO externo.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="database" className="border-none rounded-xl overflow-hidden bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold">Banco de Dados</span>
              <Badge variant="default" className="ml-2">Conectado</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground">PostgreSQL via Lovable Cloud com RLS habilitado em todas as tabelas.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="webhook" className="border-none rounded-xl overflow-hidden bg-card">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Webhook Kiwify</span>
              <Badge variant="default" className="ml-2">Configurado</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground">Edge function pronta para receber eventos de compra, reembolso, cancelamento e renovação.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AdminSettings;
