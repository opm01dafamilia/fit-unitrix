import { useState, useRef } from "react";
import { Camera, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

interface ProfilePhotoUploadProps {
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "w-12 h-12", icon: "w-4 h-4", badge: "w-5 h-5" },
  md: { container: "w-20 h-20", icon: "w-6 h-6", badge: "w-7 h-7" },
  lg: { container: "w-28 h-28", icon: "w-8 h-8", badge: "w-9 h-9" },
};

const ProfilePhotoUpload = ({ currentUrl, onUploaded, size = "lg" }: ProfilePhotoUploadProps) => {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const s = sizeMap[size];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl } as any)
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      await refreshProfile();
      onUploaded?.(publicUrl);
      toast.success("Foto atualizada!");
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div
          className={`${s.container} rounded-2xl overflow-hidden border-2 border-border/50 flex items-center justify-center cursor-pointer transition-all hover:border-primary/30`}
          style={{
            background: displayUrl
              ? `url(${displayUrl}) center/cover no-repeat`
              : "linear-gradient(135deg, hsl(152 69% 46% / 0.15), hsl(168 80% 38% / 0.1))",
          }}
          onClick={() => inputRef.current?.click()}
        >
          {!displayUrl && <Camera className={`${s.icon} text-muted-foreground`} />}
          {displayUrl && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <Camera className={`${s.icon} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          )}
        </div>
        {/* Camera badge */}
        <div
          className={`absolute -bottom-1 -right-1 ${s.badge} rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg border-2 border-background`}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="w-3 h-3 text-primary-foreground" />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {selectedFile && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={uploading} className="h-8 text-xs">
            <X className="w-3 h-3 mr-1" /> Cancelar
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={uploading} className="h-8 text-xs">
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
            {uploading ? "Enviando..." : "Salvar Foto"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;
