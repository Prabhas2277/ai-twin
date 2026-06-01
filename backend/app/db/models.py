from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student")  # "student" or "admin"
    
    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_login_at = Column(DateTime, nullable=True)
    
    # Study Habits / Profile
    preferred_learning_style = Column(String, default="visual")  # "visual", "auditory", "textual", "kinesthetic"
    daily_study_goal_hours = Column(Float, default=2.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    study_logs = relationship("StudyLog", back_populates="user", cascade="all, delete-orphan")
    weak_topics = relationship("WeakTopic", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color_code = Column(String, default="#6366f1")  # Tailwind default indigo-500
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="subjects")
    documents = relationship("Document", back_populates="subject", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="subject", cascade="all, delete-orphan")
    weak_topics = relationship("WeakTopic", back_populates="subject", cascade="all, delete-orphan")
    study_logs = relationship("StudyLog", back_populates="subject", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "pdf", "docx", "txt", "pptx", "image"
    file_path = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    topic_category = Column(String, nullable=True)  # Automatic categorization
    status = Column(String, default="processing")  # "processing", "completed", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="documents")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    difficulty = Column(String, default="medium")  # "easy", "medium", "hard", "exam"
    total_questions = Column(Integer, default=5)
    score = Column(Float, nullable=True)  # Store percentage (0.0 to 100.0) or actual score
    questions_json = Column(Text, nullable=False)  # JSON string holding generated questions
    answers_json = Column(Text, nullable=True)  # JSON string holding user answers and evaluation
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subject = relationship("Subject", back_populates="quizzes")


class WeakTopic(Base):
    __tablename__ = "weak_topics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_name = Column(String, nullable=False)
    weakness_score = Column(Float, default=0.5)  # 0.0 (Strong) to 1.0 (Weak)
    times_failed = Column(Integer, default=0)
    recommended_action = Column(Text, nullable=True)
    improvement_trend = Column(String, default="stable")  # "improving", "stable", "declining"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="weak_topics")
    subject = relationship("Subject", back_populates="weak_topics")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    schedule_json = Column(Text, nullable=False)  # JSON string of daily/weekly study targets
    exam_date = Column(DateTime, nullable=True)
    plan_type = Column(String, default="weekly")  # "daily", "weekly", "exam_prep"
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="study_plans")


class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, default=0)
    study_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="study_logs")
    subject = relationship("Subject", back_populates="study_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String, default="general")  # "study_reminder", "quiz_reminder", "weak_topic_alert", "streak_milestone"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
