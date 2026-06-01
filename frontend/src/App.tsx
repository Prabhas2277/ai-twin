import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { LoginRegister } from './pages/LoginRegister';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { Chat } from './pages/Chat';
import { Quiz } from './pages/Quiz';
import { Planner } from './pages/Planner';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { 
  LayoutDashboard, BookOpen, MessageSquare, 
  CheckSquare, Calendar 
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isSidebarCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useApp();
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [activePage, setActivePage] = useState<string>('dashboard');

  // Unauthenticated Views
  if (!user) {
    if (authMode === 'landing') {
      return <Landing onStart={(mode) => setAuthMode(mode)} />;
    } else {
      return (
        <LoginRegister 
          initialMode={authMode === 'login' ? 'login' : 'register'}
          onBack={() => setAuthMode('landing')} 
        />
      );
    }
  }

  // Authenticated View Router Layout
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'subjects':
        return <Subjects />;
      case 'chat':
        return <Chat />;
      case 'quiz':
        return <Quiz />;
      case 'planner':
        return <Planner />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'quiz', label: 'Quiz', icon: CheckSquare },
    { id: 'planner', label: 'Planner', icon: Calendar },
  ];

  return (
    <div className="min-h-screen grid-bg relative flex bg-background text-foreground transition-colors duration-300">
      {/* Visual floating neon glow filters */}
      <div className="glow-circle bg-primary w-[300px] h-[300px] -top-10 left-[20%]"></div>
      <div className="glow-circle bg-secondary w-[250px] h-[250px] bottom-[15%] right-[10%]"></div>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-all duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Container */}
      <main className={`flex-1 min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      } pl-0 pb-20 lg:pb-0 w-full`}>
        <div className="w-full relative z-10 max-w-7xl mx-auto">
          {renderActivePage()}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-xl border-t border-border/80 flex items-center justify-around z-30 px-2 pb-safe select-none shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivePage(item.id);
                setMobileSidebarOpen(false); // safety close
              }}
              aria-label={item.label}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
              }`}
              style={{ minHeight: '48px' }} // Accessible touch area
            >
              <Icon className={`h-5.5 w-5.5 transition ${isActive ? 'scale-110' : 'scale-100'}`} />
              <span className="text-[10px] tracking-wide font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
