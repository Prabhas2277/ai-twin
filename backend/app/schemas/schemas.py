from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_learning_style: Optional[str] = None
    daily_study_goal_hours: Optional[float] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]
    role: str
    xp: int
    level: int
    streak_days: int
    preferred_learning_style: str
    daily_study_goal_hours: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- SUBJECT SCHEMAS ---
class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    color_code: Optional[str] = "#6366f1"

class SubjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    color_code: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- DOCUMENT SCHEMAS ---
class DocumentResponse(BaseModel):
    id: int
    subject_id: int
    name: str
    file_type: str
    summary: Optional[str]
    topic_category: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- QUIZ SCHEMAS ---
class QuizCreate(BaseModel):
    subject_id: int
    difficulty: str = "medium"  # "easy", "medium", "hard", "exam"
    total_questions: int = 5

class QuizSubmit(BaseModel):
    score: float  # Percentage score e.g., 80.0
    answers_json: str  # JSON representation of selected options and correctness
    weak_topics: List[str]  # List of topics failed/weak in this quiz

class QuizResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    difficulty: str
    total_questions: int
    score: Optional[float]
    questions_json: str
    answers_json: Optional[str]
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- CHAT SCHEMAS ---
class ChatQuery(BaseModel):
    query: str
    subject_ids: Optional[List[int]] = None
    document_ids: Optional[List[int]] = None
    response_mode: str = "beginner"  # "beginner", "exam", "expert", "teacher"

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]

# --- PLANNER SCHEMAS ---
class StudyPlanCreate(BaseModel):
    subjects: List[str]
    available_hours: float
    exam_date: Optional[str] = None  # Format: YYYY-MM-DD

class StudyPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    schedule_json: str
    exam_date: Optional[datetime]
    plan_type: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class StudyLogCreate(BaseModel):
    subject_id: int
    duration_minutes: int

class StudyLogResponse(BaseModel):
    id: int
    user_id: int
    subject_id: int
    duration_minutes: int
    study_date: date
    created_at: datetime

    class Config:
        from_attributes = True

# --- WEAK TOPIC SCHEMAS ---
class WeakTopicResponse(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    topic_name: str
    weakness_score: float
    times_failed: int
    recommended_action: Optional[str]
    improvement_trend: str

    class Config:
        from_attributes = True

# --- ANALYTICS SCHEMAS ---
class DashboardOverview(BaseModel):
    total_subjects: int
    documents_uploaded: int
    quizzes_completed: int
    study_hours: float
    knowledge_score: float
    weak_topics_count: int
    level: int
    xp: int
    streak: int
    recent_activity: List[Dict[str, Any]]
    recommendations: List[str]

# --- ADMIN SCHEMAS ---
class AdminUserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    xp: int
    level: int
    created_at: datetime

class AdminStatsResponse(BaseModel):
    total_users: int
    total_subjects: int
    total_documents: int
    total_quizzes: int
    total_study_minutes: int
    system_load_status: str
