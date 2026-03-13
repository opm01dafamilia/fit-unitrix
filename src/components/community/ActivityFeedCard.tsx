import { Dumbbell, UtensilsCrossed, Flame, Trophy, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const reactionEmojis = ["💪", "🔥", "👏", "⚡", "🏆"];

const activityIcons: Record<string, any> = {
  workout: Dumbbell,
  diet: UtensilsCrossed,
  streak: Flame,
  achievement: Trophy,
  goal: Target,
};

const activityColors: Record<string, string> = {
  workout: "text-primary",
  diet: "text-chart-3",
  streak: "text-orange-400",
  achievement: "text-yellow-500",
  goal: "text-chart-4",
};

const activityBgs: Record<string, string> = {
  workout: "from-primary/15 to-primary/5",
  diet: "from-chart-3/15 to-chart-3/5",
  streak: "from-orange-400/15 to-orange-400/5",
  achievement: "from-yellow-500/15 to-yellow-500/5",
  goal: "from-chart-4/15 to-chart-4/5",
};

export type Activity = {
  id: string;
  user_id: string;
  user_name: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
  reactions: { emoji: string; user_id: string }[];
  reaction_count: number;
};

type Props = {
  activity: Activity;
  currentUserId?: string;
  onReaction: (activityId: string, emoji: string) => void;
  onUserClick: (userId: string, userName: string) => void;
};

const ActivityFeedCard = ({ activity, currentUserId, onReaction, onUserClick }: Props) => {
  const Icon = activityIcons[activity.activity_type] || Dumbbell;
  const color = activityColors[activity.activity_type] || "text-primary";
  const bg = activityBgs[activity.activity_type] || "from-primary/15 to-primary/5";
  const myReaction = activity.reactions.find(r => r.user_id === currentUserId);
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="glass-card p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <button
              onClick={() => onUserClick(activity.user_id, activity.user_name)}
              className="font-semibold hover:text-primary transition-colors"
            >
              {activity.user_name}
            </button>
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">{activity.description}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo}</p>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
        <div className="flex gap-1">
          {reactionEmojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReaction(activity.id, emoji)}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                myReaction?.emoji === emoji
                  ? "bg-primary/15 border border-primary/20 scale-110"
                  : "bg-secondary/40 border border-border/20 hover:bg-secondary/60 hover:scale-105"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        {activity.reaction_count > 0 && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {activity.reaction_count} reação{activity.reaction_count > 1 ? "ões" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

export default ActivityFeedCard;
