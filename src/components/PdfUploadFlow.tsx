import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, FileText, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import PdfViewer from "@/components/PdfViewer";

interface PdfUploadFlowProps {
  type: "treino" | "dieta";
  onBack: () => void;
  onComplete: () => void;
}

const PdfUploadFlow = ({ type, onBack, onComplete }: PdfUploadFlowProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ name: string; path: string } | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTreino = type === "treino";
  const title = isTreino ? "Enviar PDF de Treino" : "Enviar PDF de Dieta";
  const subtitle = isTreino
    ? "Envie o plano do seu personal trainer em formato PDF"
    : "Envie o plano do seu nutricionista em formato PDF";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    const file = e.target.files[0];

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 20MB)");
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: storageError } = await supabase.storage
      .from("user-pdfs")
      .upload(filePath, file);

    if (storageError) {
      toast.error("Erro ao enviar arquivo");
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("user_files").insert({
      user_id: user.id,
      file_name: file.name,
      file_type: type,
      file_path: filePath,
      file_size: file.size,
    } as any);

    if (dbError) {
      toast.error("Erro ao registrar arquivo");
    } else {
      toast.success("PDF enviado com sucesso!");
      setUploaded({ name: file.name, path: filePath });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleView = async () => {
    if (!uploaded) return;
    const { data } = await supabase.storage
      .from("user-pdfs")
      .createSignedUrl(uploaded.path, 3600);

    if (data?.signedUrl) {
      setViewingPdf({ url: data.signedUrl, name: uploaded.name });
    } else {
      toast.error("Erro ao abrir arquivo");
    }
  };

  return (
    <>
      <div className="space-y-6 animate-slide-up">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-display font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{subtitle}</p>
        </div>

        {!uploaded ? (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 p-10 flex flex-col items-center gap-4 transition-all touch-feedback bg-secondary/20 hover:bg-secondary/40 min-h-[200px] justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/15">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Toque para selecionar PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">Máximo 20MB • Formato PDF</p>
                  </div>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-green-500/8 to-green-500/3 border-2 border-green-500/20 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">PDF enviado!</h3>
              <p className="text-sm text-muted-foreground mb-1">{uploaded.name}</p>
              <p className="text-xs text-muted-foreground">
                Salvo como {isTreino ? "treino" : "dieta"} na sua área de arquivos
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl gap-2"
                onClick={handleView}
              >
                <Eye className="w-4 h-4" /> Visualizar
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r from-primary to-primary/80"
                onClick={onComplete}
              >
                <FileText className="w-4 h-4" /> Concluir
              </Button>
            </div>
          </div>
        )}
      </div>

      {viewingPdf && (
        <PdfViewer
          url={viewingPdf.url}
          fileName={viewingPdf.name}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </>
  );
};

export default PdfUploadFlow;
