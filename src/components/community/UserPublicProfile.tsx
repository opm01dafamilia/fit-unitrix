import { useEffect, useState } from "react";
import { X, Trophy, Flame, Zap, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getRankForXP } from "@/lib/achievementsEngine";
import { Skeleton } from "@/components/ui/skeleton";

type PublicUserData = {
  user_name: string;
  total_xp: number;
  rank_tier: string;
  workout_streak: number;
  achievements_count: number;
  avatar_url?: string | null;
};

type Props = {
  userId: string;
  userName: string;
  onClose: () => void;
};

const UserPublicProfile = ({ userId, userName, onClose }: Props) => {
  const [data, setData] = useState<PublicUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Check privacy
      const { data: profileData } = await supabase
        .from("profiles")
        .select("privacy_level, avatar_url")
        .eq("user_id", userId)
        .single();

      if (profileData?.privacy_level === "private") {
        setIsPrivate(true);
        setLoading(false);
        return;
      }

      // Get ranking stats (public data only)
      const { data: rankData } = await supabase
        .from("user_ranking_stats")
        .select("user_name, total_xp, rank_tier, workout_streak, achievements_count")
        .eq("user_id", userId)
        .single();

      if (rankData) {
        setData({
          ...rankData,
          avatar_url: profileData?.avatar_url,
        });
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const rank = data ? getRankForXP(data.total_xp) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Perfil Público</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : isPrivate ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Este perfil é privado 🔒</p>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Avatar & Name */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-2/10 flex items-center justify-center border border-primary/15 mx-auto mb-3">
                <span className="text-2xl font-display font-bold text-primary">
                  {data.user_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h4 className="font-display font-bold text-lg">{data.user_name}</h4>
              {rank && (
                <span className={`text-sm ${rank.color} font-medium`}>
                  {rank.icon} {rank.label}
                </span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/20">
                <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{data.total_xp}</p>
                <p className="text-[10px] text-muted-foreground">XP Total</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/20">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold">{data.workout_streak}</p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-3 text-center border border-border/20 col-span-2">
                <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{data.achievements_count}</p>
                <p className="text-[10px] text-muted-foreground">Conquistas</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Dados não disponíveis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPublicProfile;
