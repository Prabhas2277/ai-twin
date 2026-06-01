from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..db import models
from ..schemas import schemas
from ..core import security
from .deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new student or admin.
    """
    user_exists = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email is already registered."
        )
    
    # Check if we should initialize first user as admin (optional, for bootstrap)
    # By default, use role in input
    hashed_pwd = security.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role or "student",
        xp=0,
        level=1,
        streak_days=1, # Start with streak of 1 day
        last_login_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create welcome notification
    welcome_notif = models.Notification(
        user_id=new_user.id,
        title="Welcome to AI Study Twin! 🚀",
        content="I am your digital clone. Upload study materials to get started!",
        notification_type="general"
    )
    db.add(welcome_notif)
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Standard OAuth2/JWT password login.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update Streak and Last Login
    now = datetime.utcnow()
    today_date = date.today()
    
    if user.last_login_at:
        last_login_date = user.last_login_at.date()
        if last_login_date == today_date - timedelta(days=1):
            # Logged in yesterday: increment streak
            user.streak_days += 1
            # Give bonus XP for maintaining streak
            user.xp += 10
        elif last_login_date < today_date - timedelta(days=1):
            # Streak broken: reset
            user.streak_days = 1
    else:
        user.streak_days = 1
        
    # Check if level up happens (e.g. every 100 XP)
    expected_level = (user.xp // 100) + 1
    if expected_level > user.level:
        user.level = expected_level
        # Trigger level up notification
        level_notif = models.Notification(
            user_id=user.id,
            title="Level Up! 🎉",
            content=f"Congratulations! You've reached Level {user.level}!",
            notification_type="streak_milestone"
        )
        db.add(level_notif)
        
    user.last_login_at = now
    db.commit()
    
    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    """
    Fetch the logged in user profile.
    """
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_user_profile(
    user_update: schemas.UserUpdate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Update learning style preference or study goals.
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.preferred_learning_style is not None:
        current_user.preferred_learning_style = user_update.preferred_learning_style
    if user_update.daily_study_goal_hours is not None:
        current_user.daily_study_goal_hours = user_update.daily_study_goal_hours
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/notifications")
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all notifications for the current user.
    """
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()
    return notifs

@router.post("/notifications/{notif_id}/read")
def mark_notification_as_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

