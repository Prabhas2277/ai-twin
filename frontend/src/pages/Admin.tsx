import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, FolderCheck, BookOpen, Clock, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type SystemStats = {
  total_users: number;
  total_subjects: number;
  total_documents: number;
  total_quizzes: number;
  total_study_minutes: number;
  system_load_status: string;
};

type UserRow = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  xp: number;
  level: number;
  created_at: string;
};

export const Admin: React.FC = () => {
  const { token, apiUrl, user } = useApp();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const statsRes = await fetch(`${apiUrl}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersRes = await fetch(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.ok && usersRes.ok) {
        const statsData = await statsRes.json();
        const usersData = await usersRes.json();
        setStats(statsData);
        setUsersList(usersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchAdminData();
    }
  }, [token, user]);

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center text-red-500">
        <ShieldAlert className="h-12 w-12 mx-auto mb-3" />
        <h4 className="font-bold">Access Denied</h4>
        <p className="text-xs mt-1">Admin privileges are required to view this portal.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col min-h-screen text-left bg-background text-foreground transition-all">
      <Header title="Admin Command Center" />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border">
            <span className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 block mb-1">Registered Users</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Users className="h-4.5 w-4.5 text-primary" />
              <span>{stats.total_users}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border">
            <span className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 block mb-1">Subject Compartments</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-secondary" />
              <span>{stats.total_subjects}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border">
            <span className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 block mb-1">Index Files</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <FolderCheck className="h-4.5 w-4.5 text-emerald-500" />
              <span>{stats.total_documents}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border">
            <span className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 block mb-1">Assessment Tests</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-accent" />
              <span>{stats.total_quizzes}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border">
            <span className="text-[9px] uppercase font-bold text-slate-550 dark:text-slate-400 block mb-1">Global Minutes Logged</span>
            <div className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-warning" />
              <span>{stats.total_study_minutes}m</span>
            </div>
          </div>
        </div>
      )}

      {/* System Status Banner */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border/80 mb-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">System Load Metrics</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{stats?.system_load_status}</p>
          </div>
        </div>
        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-extrabold uppercase">
          Online
        </span>
      </div>

      {/* Users table */}
      <div className="glass-panel border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/80 bg-slate-100/50 dark:bg-slate-950/20 font-bold text-sm text-slate-850 dark:text-white">
          System Users Registry
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate-500 dark:text-slate-400 font-bold">
                <th className="p-4">User ID</th>
                <th className="p-4">Email</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Level</th>
                <th className="p-4">XP Score</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usersList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/25 transition">
                  <td className="p-4 text-slate-450 dark:text-slate-500 font-mono">#{row.id}</td>
                  <td className="p-4 font-extrabold text-slate-800 dark:text-white">{row.email}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-350">{row.full_name || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border ${
                      row.role === 'admin' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400' 
                        : 'bg-primary/10 border-primary/20 text-primary'
                    }`}>
                      {row.role}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-655 dark:text-slate-300">Level {row.level}</td>
                  <td className="p-4 text-warning font-extrabold">{row.xp} XP</td>
                  <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(row.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
