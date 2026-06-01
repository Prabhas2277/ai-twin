import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db.session import get_db, SessionLocal
from ..db import models
from ..schemas import schemas
from ..core.config import settings
from ..services.document_parser import parse_document
from ..services.gemini_service import summarize_and_categorize_document
from ..services.vector_store import add_document_to_vector_store, delete_document_from_vector_store
from .deps import get_current_user

router = APIRouter(prefix="/documents", tags=["Document Management"])

def process_document_background(
    doc_id: int, 
    user_id: int, 
    file_path: str, 
    file_type: str, 
    file_name: str
):
    """
    Background worker task to extract, summarize, and embed uploaded documents.
    """
    db = SessionLocal()
    try:
        doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
        if not doc:
            return
            
        # Parse document
        text = parse_document(file_path, file_type)
        if not text or text.strip() == "":
            doc.status = "failed"
            doc.summary = "Parsing returned no text content. Check file format or content."
            db.commit()
            return
            
        # Call Gemini to summarize and categorize
        gemini_res = summarize_and_categorize_document(text, file_name)
        doc.summary = gemini_res.get("summary", "Summary generation failed.")
        doc.topic_category = gemini_res.get("category", "General")
        
        # Load chunks and index in ChromaDB
        success = add_document_to_vector_store(
            user_id=user_id,
            subject_id=doc.subject_id,
            document_id=doc.id,
            text=text
        )
        
        if success:
            doc.status = "completed"
            
            # Award XP & handle leveling
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                user.xp += 50  # 50 XP for uploading study material
                expected_level = (user.xp // 100) + 1
                if expected_level > user.level:
                    user.level = expected_level
                    lvl_notif = models.Notification(
                        user_id=user_id,
                        title="Level Up! 🎉",
                        content=f"You reached Level {user.level} by syncing your brain files!",
                        notification_type="streak_milestone"
                    )
                    db.add(lvl_notif)
            
            # Success Notification
            notif = models.Notification(
                user_id=user_id,
                title="Smart Sync Complete 🧠",
                content=f"Your Twin has learned '{file_name}' under subject category '{doc.topic_category}'!",
                notification_type="general"
            )
            db.add(notif)
        else:
            doc.status = "failed"
            
        db.commit()
    except Exception as e:
        print(f"Background parsing exception: {e}")
        db.rollback()
        try:
            doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc:
                doc.status = "failed"
                doc.summary = f"Processing exception: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

@router.post("/upload", response_model=schemas.DocumentResponse)
def upload_document(
    background_tasks: BackgroundTasks,
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Uploads notes/PDFs, saves it locally, and schedules background OCR & vector indexing.
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
        
    filename = file.filename
    file_ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    allowed_exts = ["pdf", "docx", "txt", "pptx", "png", "jpg", "jpeg", "webp"]
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Supported: {', '.join(allowed_exts)}"
        )
        
    # Generate storage path
    local_file_name = f"user_{current_user.id}_sub_{subject_id}_{int(datetime.utcnow().timestamp())}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, local_file_name)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )
        
    # Register document row in DB
    new_doc = models.Document(
        subject_id=subject_id,
        name=filename,
        file_type=file_ext,
        file_path=file_path,
        status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    # Schedule background processing worker
    background_tasks.add_task(
        process_document_background,
        doc_id=new_doc.id,
        user_id=current_user.id,
        file_path=file_path,
        file_type=file_ext,
        file_name=filename
    )
    
    return new_doc

@router.get("/", response_model=List[schemas.DocumentResponse])
def list_documents(
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Lists uploaded documents. Optionally filtered by subject_id.
    """
    query = db.query(models.Document).join(models.Subject).filter(models.Subject.user_id == current_user.id)
    if subject_id is not None:
        query = query.filter(models.Document.subject_id == subject_id)
        
    return query.all()

@router.get("/{document_id}", response_model=schemas.DocumentResponse)
def get_document_details(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetches details of a single document.
    """
    doc = db.query(models.Document).join(models.Subject).filter(
        models.Document.id == document_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
    return doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes document record, cleans up ChromaDB embeddings, and deletes local physical file.
    """
    doc = db.query(models.Document).join(models.Subject).filter(
        models.Document.id == document_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied."
        )
        
    # Vector DB removal
    delete_document_from_vector_store(doc.id)
    
    # File system removal
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Failed to delete local file {doc.file_path}: {e}")
            
    db.delete(doc)
    db.commit()
    return None
