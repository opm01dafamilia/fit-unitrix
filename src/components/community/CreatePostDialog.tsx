import { useState } from "react";
import { X, Dumbbell, Trophy, Target, Flame, Scale, Camera, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const postTypes = [
  { value: "workout", label: "Treino pesado", icon: Dumbbell, emoji: "💪" },
  { value: "goal", label: "Meta alcançada", icon: Target, emoji: "🎯" },
  { value: "transformation", label: "Transformação", icon: Scale, emoji: "📸" },
  { value: "streak", label: "Streak / Consistência", icon: Flame, emoji: "🔥" },
  { value: "achievement", label: "Conquista", icon: Trophy, emoji: "🏆" },
  { value: "manual", label: "Texto motivacional", icon: Camera, emoji: "✨" },
];

type Props = {
  onClose: () => void;
  onSubmit: (type: string, text: string) => Promise<void>;
};

const CreatePostDialog = ({ onClose, onSubmit }: Props) => {
  const [selectedType, setSelectedType] = useState("manual");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await onSubmit(selectedType, text.trim());
      onClose();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/60 backdrop-blur-md" onClick={onClose}>
      <div
        className="glass-card p-5 w-full sm:max-w-md animate-slide-up rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Compartilhar Evolução</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Type Selection */}
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Tipo do post</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {postTypes.map(pt => (
            <button
              key={pt.value}
              onClick={() => setSelectedType(pt.value)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedType === pt.value
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "bg-secondary/30 border-border/20 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="text-lg block mb-1">{pt.emoji}</span>
              <span className="text-[10px] font-medium leading-tight block">{pt.label}</span>
            </button>
          ))}
        </div>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Compartilhe sua evolução, motivação ou conquista..."
          maxLength={120}
          rows={3}
          className="w-full p-3 rounded-xl bg-secondary/40 border border-border/20 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 resize-none"
        />
        <p className="text-[10px] text-muted-foreground/50 text-right mt-1">{text.length}/120</p>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || posting}
          className="w-full mt-4"
        >
          {posting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Publicar
        </Button>
      </div>
    </div>
  );
};

export default CreatePostDialog;
