from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from ..services.vector_store import query_vector_store
from ..services.gemini_service import (
    generate_study_twin_chat_response,
    generate_smart_notes,
    generate_revision_sheet
)
from .deps import get_current_user
from ..services.document_parser import parse_document

router = APIRouter(prefix="/chat", tags=["AI Study Twin Chat"])

class ChatRequest(BaseModel):
    query: str
    subject_ids: Optional[List[int]] = None
    document_ids: Optional[List[int]] = None
    response_mode: str = "beginner"  # "beginner", "exam", "expert", "teacher"
    history: Optional[List[Dict[str, str]]] = []

class NotesRequest(BaseModel):
    subject_id: Optional[int] = None
    document_id: Optional[int] = None
    note_type: str = "revision"  # "revision", "mindmap", "flashcards", "formula"

class RevisionRequest(BaseModel):
    subject_id: int

@router.post("/ask")
def ask_study_twin(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    RAG Query endpoint. Retrieves document chunks from vector store
    and feeds it to Gemini in the requested response mode.
    """
    # 1. Fetch relevant vector context
    retrieved_chunks = []
    # If the user selects a specific document, search just that. Otherwise search subjects, or default all.
    if req.document_ids:
        for doc_id in req.document_ids:
            chunks = query_vector_store(
                user_id=current_user.id,
                query=req.query,
                document_id=doc_id,
                limit=3
            )
            retrieved_chunks.extend(chunks)
    elif req.subject_ids:
        for sub_id in req.subject_ids:
            chunks = query_vector_store(
                user_id=current_user.id,
                query=req.query,
                subject_id=sub_id,
                limit=3
            )
            retrieved_chunks.extend(chunks)
    else:
        # Search all documents for this user
        retrieved_chunks = query_vector_store(
            user_id=current_user.id,
            query=req.query,
            limit=5
        )
        
    context_texts = [c["text"] for c in retrieved_chunks]
    
    # 2. Extract weak topics & strong topics for personalization
    weak_topics_query = db.query(models.WeakTopic).filter(
        models.WeakTopic.user_id == current_user.id
    ).all()
    
    weak_topics_list = [wt.topic_name for wt in weak_topics_query if wt.weakness_score >= 0.5]
    strong_topics_list = [wt.topic_name for wt in weak_topics_query if wt.weakness_score < 0.5]
    
    user_profile = {
        "preferred_learning_style": current_user.preferred_learning_style,
        "level": current_user.level,
        "xp": current_user.xp,
        "weak_topics": weak_topics_list,
        "strong_topics": strong_topics_list
    }
    
    # 3. Generate Gemini response
    response_text = generate_study_twin_chat_response(
        query=req.query,
        chat_history=req.history,
        context_chunks=context_texts,
        user_profile=user_profile,
        response_mode=req.response_mode
    )
    
    # Extract sources citation info
    sources = []
    seen_docs = set()
    for chunk in retrieved_chunks:
        doc_id = chunk["metadata"].get("document_id")
        if doc_id and doc_id not in seen_docs:
            seen_docs.add(doc_id)
            doc_record = db.query(models.Document).filter(models.Document.id == doc_id).first()
            if doc_record:
                sources.append({
                    "document_id": doc_id,
                    "name": doc_record.name,
                    "subject_id": doc_record.subject_id
                })
                
    # Award small XP for chatting
    current_user.xp += 2
    db.commit()
    
    return {
        "answer": response_text,
        "sources": sources
    }

@router.post("/generate-notes")
def generate_study_notes(
    req: NotesRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates structured chapter summaries, mind maps, formula sheets, or flashcards.
    """
    text_content = ""
    
    # 1. Fetch document or subject text
    if req.document_id:
        doc = db.query(models.Document).join(models.Subject).filter(
            models.Document.id == req.document_id,
            models.Subject.user_id == current_user.id
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        text_content = parse_document(doc.file_path, doc.file_type)
    elif req.subject_id:
        docs = db.query(models.Document).filter(
            models.Document.subject_id == req.subject_id
        ).all()
        for doc in docs:
            text_content += parse_document(doc.file_path, doc.file_type) + "\n"
    else:
        raise HTTPException(status_code=400, detail="Either subject_id or document_id is required.")
        
    if not text_content or text_content.strip() == "":
        raise HTTPException(status_code=400, detail="Selected study materials contain no text to analyze.")
        
    # 2. Call Gemini Note generator
    notes_data = generate_smart_notes(text_content, req.note_type)
    
    # Award gamification XP
    current_user.xp += 10
    db.commit()
    
    return notes_data

@router.post("/generate-revision")
def generate_revision_kit(
    req: RevisionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generates predicted topics, practice test questions, and exam revision guides.
    """
    subject = db.query(models.Subject).filter(
        models.Subject.id == req.subject_id,
        models.Subject.user_id == current_user.id
    ).first()
    
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
        
    # Fetch weak topics
    wts = db.query(models.WeakTopic).filter(
        models.WeakTopic.subject_id == req.subject_id,
        models.WeakTopic.weakness_score >= 0.5
    ).all()
    wt_names = [w.topic_name for w in wts]
    
    # Fetch document texts for context
    docs = db.query(models.Document).filter(models.Document.subject_id == req.subject_id).all()
    context_text = ""
    for d in docs[:3]:  # limit to top 3 documents to fit tokens
        context_text += parse_document(d.file_path, d.file_type) + "\n"
        
    revision_kit = generate_revision_sheet(subject.name, wt_names, context_text)
    
    current_user.xp += 15
    db.commit()
    
    return revision_kit
