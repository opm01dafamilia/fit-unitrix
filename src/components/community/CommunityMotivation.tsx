import { Sparkles } from "lucide-react";
import { useMemo } from "react";

const messages = [
  { emoji: "🔥", text: "A comunidade está evoluindo hoje!" },
  { emoji: "💪", text: "Continue firme no seu ritmo!" },
  { emoji: "⚡", text: "Sua consistência inspira outros usuários!" },
  { emoji: "🌟", text: "Cada treino conta. A comunidade cresce junto!" },
  { emoji: "🏆", text: "Grandes conquistas começam com pequenos passos!" },
  { emoji: "🚀", text: "O esforço de hoje constrói o resultado de amanhã!" },
];

const CommunityMotivation = ({ activityCount }: { activityCount: number }) => {
  const msg = useMemo(() => {
    const idx = Math.floor(Date.now() / 60000) % messages.length;
    return messages[idx];
  }, []);

  return (
    <div className="glass-card p-4 bg-gradient-to-r from-primary/5 to-chart-2/5 border-primary/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {msg.emoji} {msg.text}
          </p>
          {activityCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {activityCount} atividade{activityCount > 1 ? "s" : ""} recente{activityCount > 1 ? "s" : ""} na comunidade
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityMotivation;
