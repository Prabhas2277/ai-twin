import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from ..services.gemini_service import generate_quiz
from ..services.document_parser import parse_document
from .deps import get_current_user

router = APIRouter(prefix="/quizzes", tags=["AI Quiz Center"])

class AnswerItem(BaseModel):
    question_id: int
    user_answer: str
    is_correct: bool
    topic: Optional[str] = None  # The specific sub-topic this question tested

class QuizSubmission(BaseModel):
    answers: List[AnswerItem]
    score_percent: float

@router.post("/generate", response_model=schemas.QuizResponse)
def create_new_quiz(
    quiz_in: schemas.QuizCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates a quiz using Gemini API from the subject's documents.
    """
    subject = db.query(models.Subject).filter(
        models.Subject.id == quiz_in.subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
        
    # Gather document texts
    docs = db.query(models.Document).filter(
        models.Document.subject_id == quiz_in.subject_id,
        models.Document.status == "completed"
    ).all()
    
    if not docs:
        raise HTTPException(
            status_code=400,
            detail="You need to upload at least one completed document to generate a quiz!"
        )
        
    context_text = ""
    for d in docs:
        context_text += parse_document(d.file_path, d.file_type) + "\n"
        
    # Generate quiz via Gemini
    generated_questions = generate_quiz(
        material_text=context_text,
        subject_name=subject.name,
        difficulty=quiz_in.difficulty,
        count=quiz_in.total_questions
    )
    
    if not generated_questions:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate quiz questions via Gemini. Please try again."
        )
        
    new_quiz = models.Quiz(
        subject_id=quiz_in.subject_id,
        title=f"{subject.name} - {quiz_in.difficulty.capitalize()} Quiz",
        difficulty=quiz_in.difficulty,
        total_questions=quiz_in.total_questions,
        questions_json=json.dumps(generated_questions),
        completed=False
    )
    
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    
    return new_quiz

@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Grades the quiz, updates student XP/Level, and updates the Weak Topic Detection tables.
    """
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
        
    if quiz.completed:
        raise HTTPException(status_code=400, detail="Quiz has already been submitted.")
        
    # 1. Save results
    quiz.score = submission.score_percent
    quiz.answers_json = json.dumps([a.dict() for a in submission.answers])
    quiz.completed = True
    
    # 2. Update Weak Topic Detection
    # Process incorrect and correct questions to calibrate topic performance
    for answer in submission.answers:
        # If no topic specified, infer from subject name or use a default
        topic_name = answer.topic or "Core Material"
        topic_name = topic_name.strip()
        
        # Check if topic already exists in WeakTopic table
        weak_topic = db.query(models.WeakTopic).filter(
            models.WeakTopic.user_id == current_user.id,
            models.WeakTopic.subject_id == quiz.subject_id,
            models.WeakTopic.topic_name.ilike(topic_name)
        ).first()
        
        if not weak_topic:
            # Create a new topic score
            weak_topic = models.WeakTopic(
                user_id=current_user.id,
                subject_id=quiz.subject_id,
                topic_name=topic_name,
                weakness_score=0.5,
                times_failed=0,
                improvement_trend="stable"
            )
            db.add(weak_topic)
            db.commit()
            db.refresh(weak_topic)
            
        # Adjust weakness score based on accuracy
        if not answer.is_correct:
            # Wrong answer: increase weakness
            weak_topic.weakness_score = min(1.0, weak_topic.weakness_score + 0.15)
            weak_topic.times_failed += 1
            weak_topic.improvement_trend = "declining"
            weak_topic.recommended_action = (
                f"Review explanation of {topic_name} using Teacher Mode in Chat. "
                "Retry related quiz questions."
            )
        else:
            # Correct answer: decrease weakness
            weak_topic.weakness_score = max(0.0, weak_topic.weakness_score - 0.10)
            if weak_topic.weakness_score < 0.3:
                weak_topic.improvement_trend = "improving"
                weak_topic.recommended_action = "Concept mastered. Maintain with weekly revisions."
                
    # 3. Gamification XP Calculations
    xp_gained = 20  # Base completion XP
    # Bonus XP for high scores
    if submission.score_percent >= 90:
        xp_gained += 30  # Excellent bonus
    elif submission.score_percent >= 70:
        xp_gained += 15  # Good bonus
        
    current_user.xp += xp_gained
    
    # Check level up
    expected_level = (current_user.xp // 100) + 1
    leveled_up = False
    if expected_level > current_user.level:
        current_user.level = expected_level
        leveled_up = True
        lvl_notif = models.Notification(
            user_id=current_user.id,
            title="Level Up! 🎯",
            content=f"Woohoo! You reached Level {current_user.level} by crushing your quiz!",
            notification_type="streak_milestone"
        )
        db.add(lvl_notif)
        
    # General score notification
    quiz_notif = models.Notification(
        user_id=current_user.id,
        title="Quiz Completed 📝",
        content=f"You scored {submission.score_percent}% on '{quiz.title}' and earned {xp_gained} XP!",
        notification_type="quiz_reminder"
    )
    db.add(quiz_notif)
    
    # Log study time
    # Approximate study logs: 3 minutes per question answered
    duration = quiz.total_questions * 3
    study_log = models.StudyLog(
        user_id=current_user.id,
        subject_id=quiz.subject_id,
        duration_minutes=duration
    )
    db.add(study_log)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "score_percent": submission.score_percent,
        "xp_gained": xp_gained,
        "new_xp": current_user.xp,
        "new_level": current_user.level,
        "leveled_up": leveled_up
    }

@router.get("/history", response_model=List[schemas.QuizResponse])
def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns user's completed/pending quizzes list.
    """
    quizzes = db.query(models.Quiz).join(models.Subject).filter(
        models.Subject.user_id == current_user.id
    ).order_by(models.Quiz.created_at.desc()).all()
    return quizzes

@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch the list of top students by XP and Level.
    """
    users = db.query(models.User).order_by(models.User.xp.desc()).limit(10).all()
    leaderboard = []
    for idx, u in enumerate(users):
        leaderboard.append({
            "rank": idx + 1,
            "name": u.full_name or u.email.split("@")[0],
            "level": u.level,
            "xp": u.xp,
            "streak": u.streak_days,
            "is_current_user": u.id == current_user.id
        })
    return leaderboard

@router.get("/{quiz_id}", response_model=schemas.QuizResponse)
def get_single_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches questions and structures of a single quiz.
    """
    quiz = db.query(models.Quiz).join(models.Subject).filter(
        models.Quiz.id == quiz_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz
