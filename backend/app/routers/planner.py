import json
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from ..services.gemini_service import generate_study_plan
from .deps import get_current_user

router = APIRouter(prefix="/planner", tags=["Study Planner"])

@router.post("/generate", response_model=schemas.StudyPlanResponse)
def create_active_study_plan(
    plan_in: schemas.StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates a personalized study plan using Gemini, accounting for weak topics and exam dates.
    Sets all old plans for this user as inactive.
    """
    # 1. Fetch user's weak topics
    wts = db.query(models.WeakTopic).join(models.Subject).filter(
        models.WeakTopic.user_id == current_user.id
    ).all()
    
    weak_topics_list = []
    for wt in wts:
        weak_topics_list.append({
            "topic_name": wt.topic_name,
            "subject_name": wt.subject.name,
            "weakness_score": wt.weakness_score
        })
        
    # 2. Deactivate previous plans
    db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id
    ).update({"active": False})
    db.commit()
    
    # 3. Call Gemini
    plan_data = generate_study_plan(
        user_name=current_user.full_name or current_user.email.split("@")[0],
        subjects=plan_in.subjects,
        weak_topics=weak_topics_list,
        available_hours=plan_in.available_hours,
        exam_date=plan_in.exam_date
    )
    
    # Parse exam date
    exam_dt = None
    if plan_in.exam_date:
        try:
            exam_dt = datetime.strptime(plan_in.exam_date, "%Y-%m-%d")
        except ValueError:
            pass
            
    # 4. Save new active plan
    new_plan = models.StudyPlan(
        user_id=current_user.id,
        title=plan_data.get("title", "My Study Plan"),
        schedule_json=json.dumps(plan_data.get("schedule", [])),
        exam_date=exam_dt,
        plan_type="weekly",
        active=True
    )
    
    db.add(new_plan)
    
    # Award gamification XP
    current_user.xp += 30  # 30 XP for organizing study life
    
    # Notification
    plan_notif = models.Notification(
        user_id=current_user.id,
        title="Weekly Plan Structured 📅",
        content="Your AI study planner has prioritized weak topics. Check out your schedule!",
        notification_type="study_reminder"
    )
    db.add(plan_notif)
    
    db.commit()
    db.refresh(new_plan)
    
    return new_plan

@router.get("/active", response_model=schemas.StudyPlanResponse)
def get_active_plan(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves the student's current active study plan.
    """
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.user_id == current_user.id,
        models.StudyPlan.active == True
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active study plan found. Please generate one!"
        )
    return plan

@router.post("/log", response_model=schemas.StudyLogResponse)
def log_study_session(
    log_in: schemas.StudyLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Logs study hours for a subject and awards corresponding XP points.
    """
    subject = db.query(models.Subject).filter(
        models.Subject.id == log_in.subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied.")
        
    new_log = models.StudyLog(
        user_id=current_user.id,
        subject_id=log_in.subject_id,
        duration_minutes=log_in.duration_minutes,
        study_date=date.today()
    )
    db.add(new_log)
    
    # Gamification XP (e.g. 5 XP per 10 minutes studied)
    xp_gained = max(5, (log_in.duration_minutes // 10) * 5)
    current_user.xp += xp_gained
    
    # Update Level up check
    expected_level = (current_user.xp // 100) + 1
    if expected_level > current_user.level:
        current_user.level = expected_level
        lvl_notif = models.Notification(
            user_id=current_user.id,
            title="Level Up! 🎉",
            content=f"You reached Level {current_user.level} by logging your study time!",
            notification_type="streak_milestone"
        )
        db.add(lvl_notif)
        
    # Notification
    log_notif = models.Notification(
        user_id=current_user.id,
        title="Study Session Logged! ⏳",
        content=f"Logged {log_in.duration_minutes} minutes for '{subject.name}' (+{xp_gained} XP)",
        notification_type="general"
    )
    db.add(log_notif)
    
    db.commit()
    db.refresh(new_log)
    db.refresh(current_user)
    
    return new_log

@router.get("/logs", response_model=List[schemas.StudyLogResponse])
def get_study_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches all logged study sessions.
    """
    logs = db.query(models.StudyLog).filter(
        models.StudyLog.user_id == current_user.id
    ).order_by(models.StudyLog.study_date.desc()).all()
    return logs
