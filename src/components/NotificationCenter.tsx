import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, ChevronRight, X } from "lucide-react";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type SmartNotification } from "@/lib/smartNotificationsEngine";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = () => {
    setNotifications(getNotifications());
    setUnread(getUnreadCount());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    window.addEventListener("fitpulse_notif_update", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("fitpulse_notif_update", refresh);
    };
  }, []);

  const handleClick = (n: SmartNotification) => {
    markAsRead(n.id);
    refresh();
    if (n.actionRoute) {
      setOpen(false);
      navigate(n.actionRoute);
    }
  };

  const handleMarkAll = () => {
    markAllAsRead();
    refresh();
  };

  const timeAgo = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const priorityColor: Record<string, string> = {
    high: "border-l-destructive",
    medium: "border-l-chart-4",
    low: "border-l-chart-2",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-secondary/50 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">Notificações</h3>
                {unread > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">{unread}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={handleMarkAll} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors" title="Marcar todas como lidas">
                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)] divide-y divide-border/30">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3.5 hover:bg-secondary/30 transition-colors border-l-2 ${priorityColor[n.priority] || ""} ${
                      !n.read ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5 shrink-0">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-muted-foreground/60">{timeAgo(n.createdAt)}</span>
                          {n.actionRoute && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
