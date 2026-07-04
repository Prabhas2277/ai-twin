import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckSquare, 
  RefreshCw, Star, Play 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';

type Question = {
  id: number;
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
  topic?: string;
};

type QuizRecord = {
  id: number;
  subject_id: number;
  title: string;
  difficulty: string;
  total_questions: number;
  score: number | null;
  questions_json: string;
  answers_json: string | null;
  completed: boolean;
  created_at: string;
};

type LeaderboardUser = {
  rank: number;
  name: string;
  level: number;
  xp: number;
  streak: number;
  is_current_user: boolean;
};

export const Quiz: React.FC = () => {
  const { token, apiUrl, subjects, updateUserLocal, user } = useApp();
  
  // Quiz states
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizRecord | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Interactive taker state
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<any | null>(null);
  
  // Config state for new quiz
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'exam'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Tab views: "generator" | "history" | "leaderboard"
  const [activeTab, setActiveTab] = useState<'generator' | 'history' | 'leaderboard'>('generator');

  const fetchQuizzes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/quizzes/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaderboard = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/quizzes/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuizzes();
      fetchLeaderboard();
    }
  }, [token]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSubId) {
      alert('Please select a Subject first.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${apiUrl}/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: selectedSubId,
          difficulty: difficulty,
          total_questions: questionCount
        })
      });

      if (res.ok) {
        const quizData = await res.json();
        setActiveQuiz(quizData);
        setQuestions(JSON.parse(quizData.questions_json));
        setUserAnswers({});
        setQuizResults(null);
        fetchQuizzes();
      } else {
        const err = await res.json();
        alert(err.detail || 'Could not generate quiz. Check if you have uploaded completed documents for this subject.');
      }
    } catch (e) {
      console.error(e);
      alert('Quiz generation timed out. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qId: number, val: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !token) return;
    
    const unanswered = questions.some(q => !userAnswers[q.id]);
    if (unanswered) {
      if (!confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmittingQuiz(true);
    
    let correctCount = 0;
    const gradedAnswers = questions.map(q => {
      const uAns = userAnswers[q.id] || '';
      
      let isCorrect = false;
      if (q.type === 'MCQ' || q.type === 'True/False') {
        isCorrect = uAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      } else {
        isCorrect = uAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      }
      
      if (isCorrect) correctCount++;
      
      return {
        question_id: q.id,
        user_answer: uAns,
        is_correct: isCorrect,
        topic: q.topic || 'General Concept'
      };
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const weakTopicsList = gradedAnswers
      .filter(a => !a.is_correct)
      .map(a => a.topic);

    try {
      const res = await fetch(`${apiUrl}/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          score_percent: scorePercent,
          answers: gradedAnswers,
          weak_topics: weakTopicsList
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuizResults(data);
        
        if (user) {
          updateUserLocal({
            ...user,
            xp: data.new_xp,
            level: data.new_level
          });
        }
        
        fetchQuizzes();
        fetchLeaderboard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const startQuizFromHistory = (quiz: QuizRecord) => {
    setActiveQuiz(quiz);
    setQuestions(JSON.parse(quiz.questions_json));
    setUserAnswers({});
    setQuizResults(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full flex flex-col h-[calc(100vh-4.5rem)] lg:h-[calc(100vh-1rem)] bg-background text-foreground transition-all overflow-hidden">
      <Header title={activeQuiz ? `Quiz: ${activeQuiz.title}` : "AI Quiz Center"} />

      {!activeQuiz ? (
        // DASHBOARD VIEW FOR GENERATING OR HISTORY
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
          
          {/* Main Controls Panel */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4 overflow-y-auto shrink-0 h-fit lg:h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Generate Practice Test</h3>
              </div>

              <form onSubmit={handleGenerateQuiz} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Select Subject</label>
                  <select 
                    value={selectedSubId || ''} 
                    required
                    onChange={(e) => setSelectedSubId(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 border border-border text-xs text-slate-700 dark:text-slate-350 outline-none"
                    style={{ minHeight: '40px' }}
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-950">Choose Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-950 text-slate-805 dark:text-white">{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Difficulty</label>
                  <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 border border-border text-xs text-slate-700 dark:text-slate-350 outline-none"
                    style={{ minHeight: '40px' }}
                  >
                    <option value="easy">Easy (Concept check)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="hard">Hard (Rigorous)</option>
                    <option value="exam">Exam level (University standard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Total Questions</label>
                  <input 
                    type="number" 
                    min={3}
                    max={15}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/40 border border-border text-xs text-slate-700 dark:text-slate-355 outline-none"
                    style={{ minHeight: '40px' }}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={generating}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-background flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  style={{ minHeight: '44px' }}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Generate Quiz</span>
                    </>
                  )}
                </button>
              </form>
            </div>
            
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed shadow-sm">
              <strong>Info:</strong> Quizzes are dynamically compiled by extracting context vectors from your uploaded study materials. Ensure your subject contains completed document syncs.
            </div>
          </div>

          {/* List views: Quiz history and Leaderboard */}
          <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col overflow-hidden h-full border-border/80">
            <div className="flex border-b border-border/80 bg-slate-50 dark:bg-slate-950/20">
              <button 
                onClick={() => { setActiveTab('generator'); }}
                className={`px-6 py-4 text-xs font-bold transition cursor-pointer ${
                  activeTab === 'generator' ? 'text-primary border-b-2 border-primary bg-slate-100/50 dark:bg-slate-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                style={{ minHeight: '48px' }}
              >
                Practice Tests History
              </button>
              <button 
                onClick={() => { setActiveTab('leaderboard'); }}
                className={`px-6 py-4 text-xs font-bold transition cursor-pointer ${
                  activeTab === 'leaderboard' ? 'text-primary border-b-2 border-primary bg-slate-100/50 dark:bg-slate-900/30' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                style={{ minHeight: '48px' }}
              >
                Global Student Leaderboard
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              
              {/* Tabs Content: History list */}
              {activeTab === 'generator' && (
                <div className="space-y-4">
                  {quizzes.map(q => (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-border/80 flex items-center justify-between gap-4 shadow-sm hover:border-primary/20 transition">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{q.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500 dark:text-slate-450">
                          <span className="capitalize">Difficulty: {q.difficulty}</span>
                          <span>•</span>
                          <span>{q.total_questions} questions</span>
                          <span>•</span>
                          <span>{new Date(q.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        {q.completed ? (
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-slate-850 dark:text-white block">{q.score}%</span>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">Passed</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startQuizFromHistory(q)}
                            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-900 border hover:bg-slate-250 dark:hover:bg-slate-800 text-xs font-bold text-primary transition cursor-pointer"
                            style={{ minHeight: '40px' }}
                          >
                            Resume
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {quizzes.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-16">
                      No quiz history. Choose your subject and click Generate Quiz to start.
                    </p>
                  )}
                </div>
              )}

              {/* Tabs Content: Leaderboard */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-3">
                  {leaderboard.map(lb => (
                    <div 
                      key={lb.rank} 
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${
                        lb.is_current_user 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-slate-50/70 dark:bg-slate-950/30 border-border/80'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-extrabold w-6 text-center shrink-0 ${
                          lb.rank === 1 ? 'text-warning' :
                          lb.rank === 2 ? 'text-slate-400 dark:text-slate-300' :
                          lb.rank === 3 ? 'text-amber-600' :
                          'text-slate-400 dark:text-slate-500'
                        }`}>
                          #{lb.rank}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block">
                            {lb.name} {lb.is_current_user && '(You)'}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            Level {lb.level} • {lb.streak}d streak
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-warning font-extrabold text-xs shrink-0">
                        <Star className="h-3.5 w-3.5 fill-warning shrink-0" />
                        <span>{lb.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        // ACTIVE INTERACTIVE QUIZ WINDOW
        <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full w-full overflow-hidden border-border/80">
          
          {/* Summary / Result Overlay */}
          {quizResults ? (
            <div className="h-full overflow-y-auto flex flex-col items-center justify-center text-center p-4 space-y-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                <CheckSquare className="h-8 w-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-extrabold text-slate-850 dark:text-white">Quiz Evaluation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  You completed your self-assessment. Your digital clone memory has been calibrated.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-border/80 max-w-sm w-full grid grid-cols-2 gap-4 shadow-md">
                <div className="text-center border-r border-border/80">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase mb-1">Score</div>
                  <div className="text-3xl font-extrabold text-slate-850 dark:text-white">{quizResults.score_percent}%</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] font-medium uppercase mb-1">XP Earned</div>
                  <div className="text-3xl font-extrabold text-warning">+{quizResults.xp_gained} XP</div>
                </div>
              </div>

              {quizResults.leveled_up && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-bold max-w-sm">
                  🎉 Level Up! You reached Level {quizResults.new_level}!
                </div>
              )}

              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizResults(null);
                }}
                className="px-6 py-3.5 rounded-xl bg-slate-200 dark:bg-slate-900 border border-border hover:bg-slate-250 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                Back to Quiz Center
              </button>
            </div>
          ) : (
            // ACTIVE TEST RENDER
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Question list area */}
              <div className="flex-1 overflow-y-auto pr-1 pb-6 space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-border/60 text-left shadow-sm">
                    <div className="flex flex-wrap gap-2.5 mb-3.5">
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-900 px-2.5 py-0.5 rounded border border-border font-bold text-primary shrink-0 self-start">
                        Q{idx + 1}
                      </span>
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded border border-border text-secondary font-semibold shrink-0 self-start">
                        {q.type}
                      </span>
                      {q.topic && (
                        <span className="text-[9px] bg-slate-200 dark:bg-slate-900 px-2.5 py-0.5 rounded border border-border/50 text-slate-500 dark:text-slate-400 shrink-0 self-start font-medium truncate max-w-[180px]">
                          Topic: {q.topic}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-4 leading-relaxed">{q.question}</p>

                    {/* Question inputs */}
                    {q.type === 'MCQ' && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = userAnswers[q.id] === opt;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`p-3.5 rounded-xl text-left text-xs transition border flex justify-between items-center cursor-pointer min-h-[48px] ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary text-primary dark:text-white font-bold' 
                                  : 'bg-white dark:bg-slate-900/50 border-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'True/False' && (
                      <div className="flex gap-3.5">
                        {['True', 'False'].map(val => {
                          const isSelected = userAnswers[q.id] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleSelectOption(q.id, val)}
                              className={`px-6 py-3.5 rounded-xl text-xs font-bold transition border cursor-pointer min-h-[48px] ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary text-primary dark:text-white font-bold' 
                                  : 'bg-white dark:bg-slate-900/50 border-border text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(q.type === 'Fill in the blank' || q.type === 'Numerical' || q.type === 'Short Answer') && (
                      <input 
                        type="text" 
                        placeholder="Enter your answer..."
                        value={userAnswers[q.id] || ''}
                        onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl glass-input text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Lower submit actions */}
              <div className="pt-4 border-t border-border/80 flex justify-between items-center gap-4 shrink-0">
                <button
                  onClick={() => {
                    if (confirm('Cancel and discard quiz attempt?')) {
                      setActiveQuiz(null);
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-900 border hover:bg-slate-250 dark:hover:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  Discard Test
                </button>
                
                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz}
                  className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold text-background shadow-lg shadow-primary/10 disabled:opacity-50 cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  {submittingQuiz ? 'Evaluating Answers...' : 'Submit Answers'}
                </button>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
