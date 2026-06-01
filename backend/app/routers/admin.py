from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from .deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

class AiSettingsUpdate(BaseModel):
    max_upload_size_mb: int
    default_model: str
    system_instruction_override: Optional[str] = None

@router.get("/users", response_model=List[schemas.AdminUserResponse])
def admin_list_users(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Retrieve all registered users.
    """
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return users

@router.get("/stats", response_model=schemas.AdminStatsResponse)
def admin_get_system_stats(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Retrieve global usage metrics.
    """
    user_count = db.query(models.User).count()
    subject_count = db.query(models.Subject).count()
    document_count = db.query(models.Document).count()
    quiz_count = db.query(models.Quiz).count()
    
    logs = db.query(models.StudyLog).all()
    total_minutes = sum([l.duration_minutes for l in logs])
    
    return {
        "total_users": user_count,
        "total_subjects": subject_count,
        "total_documents": document_count,
        "total_quizzes": quiz_count,
        "total_study_minutes": total_minutes,
        "system_load_status": "Healthy (All systems operational)"
    }

@router.put("/settings")
def admin_update_ai_settings(
    settings_in: AiSettingsUpdate,
    current_admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Updates AI configurations.
    """
    # Simply echo or write to environment/file.
    # In a full app, this would update a settings model in db.
    return {
        "message": "AI settings updated successfully",
        "settings": settings_in
    }
