from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from .deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics Dashboard"])

@router.get("/overview", response_model=schemas.DashboardOverview)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Assembles overview cards, streaks, XP levels, recent actions, and AI suggestions.
    """
    # 1. Base counts
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    subject_ids = [s.id for s in subjects]
    
    doc_count = 0
    quiz_count = 0
    quizzes_completed = 0
    avg_score = 60.0  # default base knowledge score
    
    if subject_ids:
        doc_count = db.query(models.Document).filter(models.Document.subject_id.in_(subject_ids)).count()
        quizzes = db.query(models.Quiz).filter(models.Quiz.subject_id.in_(subject_ids)).all()
        quiz_count = len(quizzes)
        completed_quizzes = [q for q in quizzes if q.completed]
        quizzes_completed = len(completed_quizzes)
        if completed_quizzes:
            avg_score = sum([q.score for q in completed_quizzes]) / len(completed_quizzes)
            
    # Weak topics count (score >= 0.5)
    weak_topics_query = db.query(models.WeakTopic).filter(
        models.WeakTopic.user_id == current_user.id,
        models.WeakTopic.weakness_score >= 0.5
    ).all()
    
    # Study logs duration
    study_logs = db.query(models.StudyLog).filter(models.StudyLog.user_id == current_user.id).all()
    total_minutes = sum([sl.duration_minutes for sl in study_logs])
    study_hours = round(total_minutes / 60, 1)
    
    # 2. Gather Recent Activities
    activities = []
    # Document uploads
    recent_docs = db.query(models.Document).join(models.Subject).filter(
        models.Subject.user_id == current_user.id
    ).order_by(models.Document.created_at.desc()).limit(5).all()
    for d in recent_docs:
        activities.append({
            "type": "upload",
            "title": f"Uploaded document: {d.name}",
            "description": f"Subject: {d.subject.name} | Status: {d.status}",
            "timestamp": d.created_at
        })
        
    # Quiz completions
    recent_quizzes = db.query(models.Quiz).join(models.Subject).filter(
        models.Subject.user_id == current_user.id,
        models.Quiz.completed == True
    ).order_by(models.Quiz.created_at.desc()).limit(5).all()
    for q in recent_quizzes:
        activities.append({
            "type": "quiz",
            "title": f"Finished quiz: {q.title}",
            "description": f"Scored: {q.score}% | Difficulty: {q.difficulty.capitalize()}",
            "timestamp": q.created_at
        })
        
    # Study logs
    recent_logs = db.query(models.StudyLog).join(models.Subject).filter(
        models.Subject.user_id == current_user.id
    ).order_by(models.StudyLog.created_at.desc()).limit(5).all()
    for l in recent_logs:
        activities.append({
            "type": "study",
            "title": f"Logged study block for {l.subject.name}",
            "description": f"Studied for {l.duration_minutes} minutes",
            "timestamp": l.created_at
        })
        
    # Sort activities by timestamp desc
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_activities = activities[:5]
    for act in recent_activities:
        act["timestamp"] = act["timestamp"].isoformat()
        
    # 3. Generate AI recommendations
    recommendations = []
    if len(subjects) == 0:
        recommendations.append("Let's get started by creating your first Subject (e.g., Mathematics, Compiler Design)!")
    elif doc_count == 0:
        recommendations.append("Upload lecture slides, textbooks, or PDFs to feed your AI Study Twin.")
    
    if len(weak_topics_query) > 0:
        worst_topic = max(weak_topics_query, key=lambda x: x.weakness_score)
        recommendations.append(f"Weak area detected: '{worst_topic.topic_name}' in {worst_topic.subject.name}. Chat with your Twin in Teacher Mode or retry related quizzes.")
        
    if current_user.streak_days >= 3:
        recommendations.append(f"Incredible! You have a {current_user.streak_days}-day learning streak. Keep it alive by completing a revision block today!")
    else:
        recommendations.append("Build a daily learning habit. Log at least 15 minutes of study or take a quiz to start a streak!")
        
    if quizzes_completed < 3 and doc_count > 0:
        recommendations.append("Generate more quizzes from your notes. Validating your knowledge helps your Study Twin build an accurate memory profile.")
        
    return {
        "total_subjects": len(subjects),
        "documents_uploaded": doc_count,
        "quizzes_completed": quizzes_completed,
        "study_hours": study_hours,
        "knowledge_score": round(avg_score, 1),
        "weak_topics_count": len(weak_topics_query),
        "level": current_user.level,
        "xp": current_user.xp,
        "streak": current_user.streak_days,
        "recent_activity": recent_activities,
        "recommendations": recommendations[:3] # Return top 3 recommendations
    }

@router.get("/performance")
def get_performance_charts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns data arrays formatted directly for Recharts (Line, Pie, Area) widgets.
    """
    # 1. Subject-wise performance
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    subject_stats = []
    
    for s in subjects:
        docs = db.query(models.Document).filter(models.Document.subject_id == s.id).all()
        quizzes = db.query(models.Quiz).filter(models.Quiz.subject_id == s.id, models.Quiz.completed == True).all()
        
        avg_score = 0.0
        if quizzes:
            avg_score = sum([q.score for q in quizzes]) / len(quizzes)
            
        logs = db.query(models.StudyLog).filter(models.StudyLog.subject_id == s.id).all()
        total_time = sum([l.duration_minutes for l in logs])
        
        subject_stats.append({
            "subject_id": s.id,
            "name": s.name,
            "color": s.color_code,
            "document_count": len(docs),
            "quiz_count": len(quizzes),
            "average_score": round(avg_score, 1),
            "total_study_minutes": total_time
        })
        
    # 2. Study Consistency (Last 7 Days)
    today = date.today()
    consistency_data = []
    
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        target_date_str = target_date.strftime("%a") # e.g. "Mon"
        
        logs = db.query(models.StudyLog).filter(
            models.StudyLog.user_id == current_user.id,
            models.StudyLog.study_date == target_date
        ).all()
        
        minutes = sum([l.duration_minutes for l in logs])
        
        consistency_data.append({
            "day": target_date_str,
            "date": target_date.strftime("%Y-%m-%d"),
            "minutes": minutes
        })
        
    # 3. Knowledge Growth (Historical Quizzes)
    quizzes = db.query(models.Quiz).join(models.Subject).filter(
        models.Subject.user_id == current_user.id,
        models.Quiz.completed == True
    ).order_by(models.Quiz.created_at.asc()).all()
    
    growth_data = []
    for q in quizzes:
        growth_data.append({
            "quiz_title": q.title,
            "score": q.score,
            "date": q.created_at.strftime("%m/%d")
        })
        
    return {
        "subject_performance": subject_stats,
        "study_consistency": consistency_data,
        "knowledge_growth": growth_data
    }

@router.get("/weak-topics", response_model=List[schemas.WeakTopicResponse])
def get_weak_topics_list(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns full list of user's weak topics with subject names.
    """
    wts = db.query(models.WeakTopic).join(models.Subject).filter(
        models.WeakTopic.user_id == current_user.id
    ).order_by(models.WeakTopic.weakness_score.desc()).all()
    
    results = []
    for wt in wts:
        results.append({
            "id": wt.id,
            "subject_id": wt.subject_id,
            "subject_name": wt.subject.name,
            "topic_name": wt.topic_name,
            "weakness_score": wt.weakness_score,
            "times_failed": wt.times_failed,
            "recommended_action": wt.recommended_action,
            "improvement_trend": wt.improvement_trend
        })
    return results
