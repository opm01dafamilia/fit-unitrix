import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Trash2, Eye, Loader2, Dumbbell, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PdfViewer from "@/components/PdfViewer";

type UserFile = {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  ai_extracted_data: any;
  created_at: string;
};

const MeusArquivos = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>("treino");
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchFiles();
  }, [user]);

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setFiles((data as UserFile[]) || []);
    setLoading(false);
  };

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
      file_type: uploadType,
      file_path: filePath,
      file_size: file.size,
    } as any);

    if (dbError) {
      toast.error("Erro ao registrar arquivo");
    } else {
      toast.success("PDF enviado com sucesso!");
      fetchFiles();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (file: UserFile) => {
    await supabase.storage.from("user-pdfs").remove([file.file_path]);
    const { error } = await supabase.from("user_files").delete().eq("id", file.id);
    if (!error) {
      setFiles(f => f.filter(x => x.id !== file.id));
      toast.success("Arquivo removido");
    }
  };

  const handleView = async (file: UserFile) => {
    const { data } = await supabase.storage
      .from("user-pdfs")
      .createSignedUrl(file.file_path, 3600);

    if (data?.signedUrl) {
      setViewingPdf({ url: data.signedUrl, name: file.file_name });
    } else {
      toast.error("Erro ao abrir arquivo");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">Meus Arquivos</h3>
              <p className="text-[11px] text-muted-foreground">PDFs de treino e dieta</p>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Select value={uploadType} onValueChange={setUploadType}>
            <SelectTrigger className="bg-secondary/50 border-border/50 w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="treino">📋 Treino</SelectItem>
              <SelectItem value="dieta">🥗 Dieta</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="flex-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Enviando..." : "Enviar PDF"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* File list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum arquivo enviado</p>
            <p className="text-[11px] text-muted-foreground mt-1">Envie PDFs do seu personal ou nutricionista</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  file.file_type === "treino"
                    ? "bg-primary/10"
                    : "bg-green-500/10"
                }`}>
                  {file.file_type === "treino" ? (
                    <Dumbbell className="w-5 h-5 text-primary" />
                  ) : (
                    <Apple className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 text-muted-foreground capitalize">
                      {file.file_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(file.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatSize(file.file_size)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleView(file)}
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(file)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
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

export default MeusArquivos;
