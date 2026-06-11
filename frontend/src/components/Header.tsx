import React, { useState, useEffect } from 'react';
import { Bell, Check, Menu, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  notification_type: string;
  created_at: string;
}

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { setMobileSidebarOpen } = useApp();

  return (
    <div className="w-full flex items-center justify-between pb-4 mb-6 border-b border-border/40 gap-4 mt-2">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger menu */}
        <button 
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-2.5 rounded-xl bg-card border border-border/80 text-slate-600 dark:text-slate-400 hover:text-primary transition"
          aria-label="Open menu drawer"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
            {title}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI Study Twin • Synchronized & Learning
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Notification Bell Dropdown */}
        <NotificationBell />
      </div>
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const { token, apiUrl } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/auth/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifs();
      // Poll every 15s to get new alerts
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markAsRead = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`${apiUrl}/auth/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-card border border-border/80 text-slate-600 dark:text-slate-400 hover:text-primary hover:border-primary/45 transition-all"
        aria-label="Open notifications"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass-panel border rounded-xl shadow-2xl p-4 z-50 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</h4>
            <span className="text-[10px] bg-primary/20 text-primary font-medium px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto mt-2 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-lg border text-xs transition-all relative ${
                    notif.is_read 
                      ? 'bg-slate-50 dark:bg-slate-950/20 border-border/40 text-slate-500 dark:text-slate-400' 
                      : 'bg-primary/5 border-primary/20 text-slate-800 dark:text-white font-medium'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{notif.title}</span>
                    {!notif.is_read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="text-slate-400 hover:text-success transition"
                        style={{ minWidth: '24px', minHeight: '24px' }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{notif.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
