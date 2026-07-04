from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .db.session import engine
from .db import models
from .routers import auth, subjects, documents, chats, quizzes, planner, analytics, admin

# Initialize database tables on startup if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Study Twin API",
    description="Backend API services powering the personalized student AI twin application.",
    version="1.0.0"
)

# CORS configuration to allow local frontend connection
# React usually runs on http://localhost:5173 or http://127.0.0.1:5173
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://ai-twin-three.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(quizzes.router, prefix="/api")
app.include_router(planner.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "Healthy",
        "app": "AI Study Twin API Server",
        "documentation": "/docs"
    }
