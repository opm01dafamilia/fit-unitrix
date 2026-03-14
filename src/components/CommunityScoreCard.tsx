import { useState, useEffect } from "react";
import { Users, TrendingUp, TrendingDown, MapPin, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CommunityStats {
  globalAvg: number;
  cityAvg: number | null;
  levelAvg: number | null;
  totalUsers: number;
  cityName?: string;
  levelName?: string;
}

interface Props {
  userScore: number;
}

const CommunityScoreCard = ({ userScore }: Props) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAndUpsert = async () => {
      // Upsert current user's score
      const city = profile?.city || null;
      const level = profile?.experience_level || null;

      await supabase.from("fitness_scores" as any).upsert(
        { user_id: user.id, score: userScore, tier: userScore >= 86 ? "elite" : userScore >= 61 ? "alta" : userScore >= 31 ? "media" : "baixa", city, experience_level: level, updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );

      // Fetch all scores
      const { data } = await supabase.from("fitness_scores" as any).select("score, city, experience_level") as any;
      const scores: { score: number; city: string | null; experience_level: string | null }[] = data || [];

      if (scores.length === 0) { setLoading(false); return; }

      const globalAvg = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);

      let cityAvg: number | null = null;
      let cityName = city || undefined;
      if (city) {
        const cityScores = scores.filter(s => s.city?.toLowerCase() === city.toLowerCase());
        if (cityScores.length > 1) {
          cityAvg = Math.round(cityScores.reduce((a, s) => a + s.score, 0) / cityScores.length);
        }
      }

      let levelAvg: number | null = null;
      let levelName = level || undefined;
      if (level) {
        const levelScores = scores.filter(s => s.experience_level === level);
        if (levelScores.length > 1) {
          levelAvg = Math.round(levelScores.reduce((a, s) => a + s.score, 0) / levelScores.length);
        }
      }

      setStats({ globalAvg, cityAvg, levelAvg, totalUsers: scores.length, cityName, levelName });
      setLoading(false);
    };

    fetchAndUpsert();
  }, [user, userScore, profile?.city, profile?.experience_level]);

  if (loading || !stats) return null;

  const comparisons = [
    { label: "Média Global", avg: stats.globalAvg, icon: Users, subtitle: `${stats.totalUsers} usuários` },
    ...(stats.cityAvg !== null ? [{ label: `Média em ${stats.cityName}`, avg: stats.cityAvg, icon: MapPin, subtitle: "sua cidade" }] : []),
    ...(stats.levelAvg !== null ? [{ label: `Média ${stats.levelName}`, avg: stats.levelAvg, icon: BarChart3, subtitle: "seu nível" }] : []),
  ];

  return (
    <div className="glass-card p-5 lg:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-chart-4/15 to-chart-4/5 flex items-center justify-center">
          <Users className="w-4 h-4 text-chart-4" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm">Seu Desempenho na Comunidade</h3>
          <p className="text-[10px] text-muted-foreground">Comparação segura — sem dados pessoais</p>
        </div>
      </div>

      <div className="space-y-3">
        {comparisons.map((c) => {
          const diff = stats.globalAvg > 0 ? Math.round(((userScore - c.avg) / c.avg) * 100) : 0;
          const isAbove = diff > 0;
          const isEqual = diff === 0;

          return (
            <div key={c.label} className="p-3.5 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{c.label}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">{c.subtitle}</span>
              </div>

              {/* Comparison bar */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Você</span>
                    <span className="text-[10px] font-bold">{userScore}</span>
                  </div>
                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isAbove ? "bg-primary" : isEqual ? "bg-chart-3" : "bg-destructive/70"
                      }`}
                      style={{ width: `${Math.min(userScore, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Comunidade</span>
                    <span className="text-[10px] font-bold">{c.avg}</span>
                  </div>
                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-muted-foreground/30 transition-all duration-700"
                      style={{ width: `${Math.min(c.avg, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diff badge */}
              <div className="mt-2.5 flex items-center gap-1.5">
                {isAbove ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-semibold text-primary">+{diff}% acima da média 🔥</span>
                  </>
                ) : isEqual ? (
                  <span className="text-[10px] font-semibold text-chart-3">Na média da comunidade</span>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-destructive" />
                    <span className="text-[10px] font-semibold text-destructive">{diff}% abaixo da média</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityScoreCard;
