import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserProfile = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  xp: number;
  level: number;
  streak_days: number;
  preferred_learning_style: string;
  daily_study_goal_hours: number;
  created_at: string;
};

export type Subject = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  color_code: string;
  created_at: string;
};

interface AppContextType {
  user: UserProfile | null;
  token: string | null;
  subjects: Subject[];
  theme: 'dark' | 'light';
  apiUrl: string;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (val: boolean) => void;
  login: (token: string, userProfile: UserProfile) => void;
  logout: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  fetchSubjects: () => Promise<void>;
  updateUserLocal: (updatedUser: UserProfile) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'; // matches FastAPI port

  useEffect(() => {
    // Restore session
    const storedToken = localStorage.getItem('twin_token');
    const storedUser = localStorage.getItem('twin_user');
    const storedTheme = localStorage.getItem('twin_theme') as 'dark' | 'light' | null;
    const storedCollapsed = localStorage.getItem('twin_sidebar_collapsed');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.className = storedTheme;
    } else {
      document.documentElement.className = 'dark';
    }
    if (storedCollapsed) {
      setSidebarCollapsed(storedCollapsed === 'true');
    }
  }, []);

  const login = (authToken: string, userProfile: UserProfile) => {
    setToken(authToken);
    setUser(userProfile);
    localStorage.setItem('twin_token', authToken);
    localStorage.setItem('twin_user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSubjects([]);
    localStorage.removeItem('twin_token');
    localStorage.removeItem('twin_user');
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('twin_theme', newTheme);
    document.documentElement.className = newTheme;
  };

  const toggleSidebarCollapsed = (val: boolean) => {
    setSidebarCollapsed(val);
    localStorage.setItem('twin_sidebar_collapsed', val.toString());
  };

  const updateUserLocal = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('twin_user', JSON.stringify(updatedUser));
  };

  const fetchSubjects = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/subjects/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (e) {
      console.error('Failed to fetch subjects:', e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSubjects();
    }
  }, [token]);

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        subjects,
        theme,
        apiUrl,
        isSidebarCollapsed,
        setSidebarCollapsed: toggleSidebarCollapsed,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        login,
        logout,
        setTheme,
        fetchSubjects,
        updateUserLocal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
