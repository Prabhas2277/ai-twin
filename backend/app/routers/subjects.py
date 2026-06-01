import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from ..services.vector_store import delete_document_from_vector_store
from .deps import get_current_user

router = APIRouter(prefix="/subjects", tags=["Subject Management"])

@router.post("/", response_model=schemas.SubjectResponse)
def create_subject(
    subject_in: schemas.SubjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a new subject space.
    """
    new_sub = models.Subject(
        user_id=current_user.id,
        name=subject_in.name,
        description=subject_in.description,
        color_code=subject_in.color_code
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    
    # Award gamification XP
    current_user.xp += 15
    db.commit()
    
    return new_sub

@router.get("/", response_model=List[schemas.SubjectResponse])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lists all subjects owned by the current student.
    """
    subjects = db.query(models.Subject).filter(models.Subject.user_id == current_user.id).all()
    return subjects

@router.get("/{subject_id}")
def get_subject_detail(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieves detailed breakdown of a subject, including files, quizzes, and weak topics.
    """
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or access denied."
        )
        
    docs = db.query(models.Document).filter(models.Document.subject_id == subject.id).all()
    quizzes = db.query(models.Quiz).filter(models.Quiz.subject_id == subject.id).all()
    weak_topics = db.query(models.WeakTopic).filter(models.WeakTopic.subject_id == subject.id).all()
    
    # Compute progress: avg quiz score
    completed_quizzes = [q for q in quizzes if q.completed]
    avg_score = 0.0
    if completed_quizzes:
        avg_score = sum([q.score for q in completed_quizzes]) / len(completed_quizzes)
        
    return {
        "id": subject.id,
        "name": subject.name,
        "description": subject.description,
        "color_code": subject.color_code,
        "created_at": subject.created_at,
        "documents": docs,
        "quizzes": quizzes,
        "weak_topics": weak_topics,
        "average_score": avg_score,
        "total_documents": len(docs),
        "total_quizzes": len(quizzes)
    }

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes subject, physical document files, and vectors from ChromaDB.
    """
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or access denied."
        )
        
    # Get all documents for cascading file deletion
    docs = db.query(models.Document).filter(models.Document.subject_id == subject.id).all()
    for doc in docs:
        delete_document_from_vector_store(doc.id)
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception as e:
                print(f"Failed to delete file {doc.file_path}: {e}")
                
    db.delete(subject)
    db.commit()
    return None
