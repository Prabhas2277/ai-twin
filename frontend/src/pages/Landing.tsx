import React from 'react';
import { Zap, BookOpen, Brain, Trophy, ArrowRight } from 'lucide-react';

interface LandingProps {
  onStart: (mode: 'login' | 'register') => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {


  return (
    <div className="relative min-h-screen grid-bg overflow-hidden flex flex-col justify-between bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center gap-[3px]">
            <span className="h-5 w-[3px] rounded-full bg-primary"></span>
            <span className="h-5 w-[3px] rounded-full bg-primary/40"></span>
          </div>
          <span className="font-display font-semibold text-xl text-white">
            AI Study Twin
          </span>
        </div>
        
        <div className="flex items-center gap-3">

          
          <button 
            onClick={() => onStart('login')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 border border-border/80 hover:bg-slate-850 dark:hover:bg-slate-750 text-xs sm:text-sm font-semibold text-white transition-all shadow-md shadow-slate-950/20"
            style={{ minHeight: '44px' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-[10px] sm:text-xs text-slate-400 font-medium mb-6">
          <SparklesIcon className="h-3.5 w-3.5 text-primary" />
          <span>Personalization engine v1.0</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold text-white mb-6 leading-tight max-w-4xl">
          Meet your digital <br />
          <span className="text-primary">learning clone</span>
        </h1>

        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed">
          AI Study Twin digests your textbooks, notes, and lecture slides. It builds an active model of your learning style, answers questions the way you understand best, and helps you master complex subjects.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
          <button 
            onClick={() => onStart('register')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-sm font-bold text-background transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.02]"
            style={{ minHeight: '48px' }}
          >
            <span>Create Study Twin</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onStart('login')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-border hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-white transition"
            style={{ minHeight: '48px' }}
          >
            Explore Dashboard
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-16 md:mt-24">
          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/10">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-850 dark:text-white mb-2">Cognitive Profiling</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Dynamically maps your knowledge depth, tracking strong topics and automatically detecting study gaps.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4 border border-secondary/10">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-850 dark:text-white mb-2">Smart Sync</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Drag-and-drop PDFs, slides, or images. Native OCR parses and indexes text directly into vector database.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4 border border-accent/10">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-850 dark:text-white mb-2">Adaptive Chat</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Tutoring modes allow you to select explanations in Beginner, Exam, Expert, or Socratic Teacher styles.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel text-left">
            <div className="h-10 w-15 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/10">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-850 dark:text-white mb-2">Gamified Mastery</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Earn XP, level up your profile, maintain streak counts, and compete in global study leaderboards.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 z-10 border-t border-border/20">
        © {new Date().getFullYear()} AI Study Twin. Personal 24/7 Digital Mentor.
      </footer>
    </div>
  );
};

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </svg>
);
