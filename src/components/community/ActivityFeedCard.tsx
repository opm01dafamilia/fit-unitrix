import { useState } from "react";
import { Dumbbell, UtensilsCrossed, Flame, Trophy, Target, MapPin, MessageCircle, ChevronDown, ChevronUp, Send, Trash2, Scale, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const reactionEmojis = [
  { emoji: "❤️", label: "Curtir" },
  { emoji: "🔥", label: "Motivação" },
  { emoji: "👏", label: "Parabéns" },
];

const activityIcons: Record<string, any> = {
  workout: Dumbbell,
  diet: UtensilsCrossed,
  streak: Flame,
  achievement: Trophy,
  goal: Target,
  weight: Scale,
  ranking: Trophy,
  invite: Target,
  transformation: Flame,
  manual: Flame,
};

const activityColors: Record<string, string> = {
  workout: "text-primary",
  diet: "text-chart-3",
  streak: "text-orange-400",
  achievement: "text-yellow-500",
  goal: "text-chart-4",
  weight: "text-chart-2",
  ranking: "text-yellow-500",
  invite: "text-chart-2",
  transformation: "text-primary",
  manual: "text-primary",
};

const activityBgs: Record<string, string> = {
  workout: "from-primary/15 to-primary/5",
  diet: "from-chart-3/15 to-chart-3/5",
  streak: "from-orange-400/15 to-orange-400/5",
  achievement: "from-yellow-500/15 to-yellow-500/5",
  goal: "from-chart-4/15 to-chart-4/5",
  weight: "from-chart-2/15 to-chart-2/5",
  ranking: "from-yellow-500/15 to-yellow-500/5",
  invite: "from-chart-2/15 to-chart-2/5",
  transformation: "from-primary/15 to-primary/5",
  manual: "from-primary/15 to-primary/5",
};

const activityLabels: Record<string, string> = {
  workout: "Treino",
  diet: "Dieta",
  streak: "Streak",
  achievement: "Conquista",
  goal: "Meta",
  weight: "Peso",
  ranking: "Ranking",
  invite: "Convite",
  transformation: "Transformação",
  manual: "Post",
};

export type FeedComment = {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  user_name: string;
  user_city?: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
  reactions: { emoji: string; user_id: string }[];
  reaction_count: number;
  comments: FeedComment[];
};

type Props = {
  activity: Activity;
  currentUserId?: string;
  onReaction: (activityId: string, emoji: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onComment: (activityId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
};

const ActivityFeedCard = ({ activity, currentUserId, onReaction, onUserClick, onComment, onDeleteComment }: Props) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const Icon = activityIcons[activity.activity_type] || Dumbbell;
  const color = activityColors[activity.activity_type] || "text-primary";
  const bg = activityBgs[activity.activity_type] || "from-primary/15 to-primary/5";
  const label = activityLabels[activity.activity_type] || "Atividade";
  const myReaction = activity.reactions.find(r => r.user_id === currentUserId);
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR });

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    onComment(activity.id, commentText.trim());
    setCommentText("");
  };

  // Count reactions by emoji
  const reactionCounts = reactionEmojis.map(r => ({
    ...r,
    count: activity.reactions.filter(ar => ar.emoji === r.emoji).length,
  }));

  return (
    <div className="glass-card p-4 lg:p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onUserClick(activity.user_id, activity.user_name)}
              className="font-semibold text-sm hover:text-primary transition-colors"
            >
              {activity.user_name}
            </button>
            <span className={`text-[10px] px-2 py-0.5 rounded-md bg-secondary/60 border border-border/20 font-medium ${color}`}>
              {label}
            </span>
          </div>
          {activity.user_city && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {activity.user_city}
            </p>
          )}
          <p className="text-[13px] text-muted-foreground/90 mt-1.5 leading-relaxed">{activity.description}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">{timeAgo}</p>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-border/20">
        <div className="flex gap-1.5">
          {reactionCounts.map(r => (
            <button
              key={r.emoji}
              onClick={() => onReaction(activity.id, r.emoji)}
              title={r.label}
              className={`h-8 px-2.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                myReaction?.emoji === r.emoji
                  ? "bg-primary/15 border border-primary/25 scale-105"
                  : "bg-secondary/40 border border-border/20 hover:bg-secondary/60 hover:scale-105"
              }`}
            >
              {r.emoji}
              {r.count > 0 && <span className="text-[10px] font-medium">{r.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary/40"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {activity.comments.length > 0 && <span>{activity.comments.length}</span>}
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-border/15 space-y-2.5 animate-slide-up">
          {activity.comments.length > 0 ? (
            activity.comments.map(c => (
              <div key={c.id} className="flex items-start gap-2 group">
                <div className="w-6 h-6 rounded-md bg-secondary/60 flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground">
                  {c.user_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-secondary/30 rounded-lg px-3 py-2 border border-border/10">
                    <span className="text-[11px] font-semibold">{c.user_name}</span>
                    <p className="text-[12px] text-muted-foreground/90 mt-0.5">{c.content}</p>
                  </div>
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5 px-1">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {c.user_id === currentUserId && (
                  <button
                    onClick={() => onDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/50 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground/50 text-center py-2">Nenhum comentário ainda</p>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmitComment()}
              placeholder="Escreva um comentário..."
              maxLength={200}
              className="flex-1 h-8 px-3 rounded-lg bg-secondary/40 border border-border/20 text-[12px] placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeedCard;
