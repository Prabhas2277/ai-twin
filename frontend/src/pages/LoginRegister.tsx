import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginRegisterProps {
  initialMode: 'login' | 'register';
  onBack: () => void;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ initialMode, onBack }) => {
  const { login, apiUrl } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student'); // Default role: student
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatErrorMessage = (detail: any): string => {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(err => {
        const field = err.loc ? err.loc[err.loc.length - 1] : '';
        return `${field ? `${field}: ` : ''}${err.msg}`;
      }).join(', ');
    }
    if (typeof detail === 'object' && detail !== null) {
      return detail.message || JSON.stringify(detail);
    }
    return 'An error occurred. Please check inputs.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        // Register API call
        const regRes = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, role })
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(formatErrorMessage(regData.detail) || 'Registration failed');
        }
      }

      // Login call
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', email);
      loginFormData.append('password', password);

      const logRes = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginFormData
      });

      const logData = await logRes.json();
      if (!logRes.ok) {
        throw new Error(formatErrorMessage(logData.detail) || 'Login failed');
      }

      // Fetch User profile to save to context
      const profileRes = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${logData.access_token}` }
      });
      
      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error('Failed to retrieve user profile');
      }

      login(logData.access_token, profileData);
    } catch (e: any) {
      setError(e.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen grid-bg overflow-hidden flex flex-col justify-center items-center px-4 bg-background text-foreground transition-colors duration-300">
      {/* Background Glows */}
      <div className="glow-circle bg-primary w-[300px] h-[300px] -top-20 right-10"></div>
      <div className="glow-circle bg-accent w-[300px] h-[300px] bottom-10 left-10"></div>

      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white transition text-sm font-semibold"
        style={{ minHeight: '44px' }}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border shadow-2xl relative z-10">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/15 border border-primary/30 items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {mode === 'login' 
              ? 'Enter credentials to connect to your Study Twin.' 
              : 'Synthesize your custom learning profile.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-2">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm outline-none"
                >
                  <option value="student" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Student</option>
                  <option value="admin" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-white">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium mb-2">Email Address</label>
            <div className="relative">
              <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Password</label>
              {mode === 'login' && (
                <a href="#forgot" className="text-[10px] text-primary font-semibold hover:underline">
                  Forgot Password?
                </a>
              )}
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl glass-input text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white absolute right-3.5 top-3.5 transition"
                style={{ minHeight: '32px', minWidth: '32px' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-bold text-background transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            style={{ minHeight: '44px' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4 animate-spin" />
                <span>{mode === 'login' ? 'Authenticating...' : 'Synthesizing...'}</span>
              </span>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Register Profile'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? (
            <span>
              New student?{' '}
              <button 
                onClick={() => setMode('register')}
                className="text-primary font-semibold hover:underline transition"
                style={{ minHeight: '32px' }}
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button 
                onClick={() => setMode('login')}
                className="text-primary font-semibold hover:underline transition"
                style={{ minHeight: '32px' }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Spinner = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
