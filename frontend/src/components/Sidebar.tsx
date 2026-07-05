import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, MessageSquare, 
  CheckSquare, Calendar, BarChart2, Settings, 
  LogOut, ShieldAlert, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { 
    user, logout, 
    isSidebarCollapsed, setSidebarCollapsed,
    isMobileSidebarOpen, setMobileSidebarOpen 
  } = useApp();

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!user) return null;

  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: LayoutDashboard,
      desc: 'Overview & learning health'
    },
    { 
      id: 'subjects', 
      name: 'Subjects', 
      icon: BookOpen,
      desc: 'Browse & upload study kits'
    },
    { 
      id: 'chat', 
      name: 'Chat with Twin', 
      icon: MessageSquare,
      desc: 'Interactive Socratic tutor'
    },
    { 
      id: 'quiz', 
      name: 'Quiz Center', 
      icon: CheckSquare,
      desc: 'Challenge & level up stats'
    },
    { 
      id: 'planner', 
      name: 'Study Planner', 
      icon: Calendar,
      desc: 'Daily agendas & schedules'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: BarChart2,
      desc: 'Progress metrics & weaknesses'
    },
  ];

  // Calculate progress to next level (assuming 100 XP per level)
  const nextLevelXp = 100;
  const currentXpInLevel = user.xp % nextLevelXp;
  const progressPercent = Math.min(100, (currentXpInLevel / nextLevelXp) * 100);

  const handleMenuClick = (pageId: string) => {
    setActivePage(pageId);
    setMobileSidebarOpen(false); // Close mobile drawer when selection changes
  };

  return (
    <aside 
      className={`glass-panel h-screen fixed top-0 flex flex-col justify-between z-30 transition-all duration-300 border-r border-border/80 ${
        isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        isMobileSidebarOpen ? 'left-0 w-64' : '-left-64 lg:left-0'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="p-4 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            {/* Twin mark: two parallel strokes standing for "you + your twin" */}
            <div className="h-10 w-10 shrink-0 rounded-xl bg-card border border-border flex items-center justify-center gap-[3px]">
              <span className="h-5 w-[3px] rounded-full bg-primary"></span>
              <span className="h-5 w-[3px] rounded-full bg-primary/40"></span>
            </div>

            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="transition-all duration-300">
                <h1 className="font-display font-semibold text-base text-white leading-tight">
                  AI Study Twin
                </h1>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Learns as you do
                </span>
              </div>
            )}
          </div>

          {/* Close button on Mobile */}
          {isMobileSidebarOpen && (
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-border text-slate-500 hover:text-slate-200"
              aria-label="Close menu drawer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Collapse/Expand toggle button (Desktop only) */}
          {!isMobileSidebarOpen && (
            <button
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex absolute -right-3 top-6 h-6.5 w-6.5 items-center justify-center rounded-full border border-border bg-card text-slate-500 hover:text-primary transition-all cursor-pointer shadow-md z-40"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* User XP Gamification Badge */}
        {(!isSidebarCollapsed || isMobileSidebarOpen) ? (
          <div className="px-4 mb-4 transition-all duration-300">
            <div className="p-3.5 rounded-xl bg-card border border-border">
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono-data text-lg font-semibold text-white">Lvl {user.level}</span>
                <span className="text-[11px] text-slate-500">{user.streak_days}d streak</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1 mb-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono-data">
                {currentXpInLevel}/100 XP
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4 mt-2">
            <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center text-primary font-mono-data" title={`Level ${user.level} • ${user.xp} XP`}>
              <span className="text-xs font-bold">{user.level}</span>
            </div>
          </div>
        )}

        {/* Menu Navigation */}
        <nav className="px-2 space-y-1 relative">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isHovered = hoveredId === item.id;
            const showLabel = !isSidebarCollapsed || isMobileSidebarOpen;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Active morphing pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-primary/10 border-l-2 border-primary rounded-lg z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex flex-col justify-center rounded-lg text-sm font-medium transition-all relative z-10 ${
                    isSidebarCollapsed && !isMobileSidebarOpen ? 'items-center py-3 px-0' : 'px-3.5 py-2.5'
                  } ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {showLabel && (
                      <div className="text-left flex flex-col transition-all duration-300">
                        <span className="font-medium">{item.name}</span>
                        {/* Flowing subtext revealed on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.span
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-[10px] text-slate-500 font-normal mt-0.5"
                            >
                              {item.desc}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </button>

                {/* Collapsed flyout preview tooltip */}
                <AnimatePresence>
                  {isHovered && !showLabel && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="hidden lg:block absolute left-20 top-1/2 -translate-y-1/2 ml-2 p-3 bg-card border border-border rounded-xl shadow-2xl z-50 min-w-48 pointer-events-none"
                    >
                      <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-0.5">{item.name}</h4>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {user.role === 'admin' && (
            <div
              className="relative"
              onMouseEnter={() => setHoveredId('admin')}
              onMouseLeave={() => setHoveredId(null)}
            >
              {activePage === 'admin' && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 bg-red-500/10 border-l-2 border-red-500 rounded-lg z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <button
                onClick={() => handleMenuClick('admin')}
                className={`w-full flex flex-col justify-center rounded-lg text-sm font-medium transition-all relative z-10 ${
                  isSidebarCollapsed && !isMobileSidebarOpen ? 'items-center py-3 px-0' : 'px-3.5 py-2.5'
                } ${
                  activePage === 'admin' ? 'text-red-500' : 'text-slate-500 hover:text-white'
                }`}
                style={{ minHeight: '44px' }}
              >
                <div className="flex items-center gap-3 w-full">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-500" />
                  {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                    <div className="text-left flex flex-col transition-all duration-300">
                      <span className="font-medium">Admin Portal</span>
                      <AnimatePresence>
                        {hoveredId === 'admin' && (
                          <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[10px] text-slate-500 font-normal mt-0.5"
                          >
                            System configuration & database info
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {hoveredId === 'admin' && isSidebarCollapsed && !isMobileSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="hidden lg:block absolute left-20 top-1/2 -translate-y-1/2 ml-2 p-3 bg-card border border-border rounded-xl shadow-2xl z-50 min-w-48 pointer-events-none"
                  >
                    <h4 className="font-display font-bold text-xs text-red-500 uppercase tracking-wider mb-0.5">Admin Portal</h4>
                    <p className="text-[10px] text-slate-400">System configuration & database info</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div
            className="relative"
            onMouseEnter={() => setHoveredId('settings')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {activePage === 'settings' && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-primary/10 border-l-2 border-primary rounded-lg z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <button
              onClick={() => handleMenuClick('settings')}
              className={`w-full flex flex-col justify-center rounded-lg text-sm font-medium transition-all relative z-10 ${
                isSidebarCollapsed && !isMobileSidebarOpen ? 'items-center py-3 px-0' : 'px-3.5 py-2.5'
              } ${
                activePage === 'settings' ? 'text-primary' : 'text-slate-500 hover:text-white'
              }`}
              style={{ minHeight: '44px' }}
            >
              <div className="flex items-center gap-3 w-full">
                <Settings className={`h-5 w-5 shrink-0 ${activePage === 'settings' ? 'text-primary' : ''}`} />
                {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                  <div className="text-left flex flex-col transition-all duration-300">
                    <span className="font-medium">Settings</span>
                    <AnimatePresence>
                      {hoveredId === 'settings' && (
                        <motion.span
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] text-slate-500 font-normal mt-0.5"
                        >
                          Modify study patterns & profile
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {hoveredId === 'settings' && isSidebarCollapsed && !isMobileSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="hidden lg:block absolute left-20 top-1/2 -translate-y-1/2 ml-2 p-3 bg-card border border-border rounded-xl shadow-2xl z-50 min-w-48 pointer-events-none"
                >
                  <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider mb-0.5">Settings</h4>
                  <p className="text-[10px] text-slate-400">Modify study patterns & profile</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Footer controls & Logout */}
      <div className="p-3 border-t border-border/60 space-y-2">
        <button
          onClick={logout}
          className={`w-full flex items-center rounded-lg text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${
            isSidebarCollapsed && !isMobileSidebarOpen ? 'justify-center py-3 px-0' : 'gap-3 px-3.5 py-2.5'
          }`}
          title={isSidebarCollapsed ? "Logout" : undefined}
          style={{ minHeight: '44px' }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {(!isSidebarCollapsed || isMobileSidebarOpen) && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
