from fastapi import APIRouter

from app.api.endpoints import auth, projects, issues, comments

api_router = APIRouter()

# Auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Project endpoints
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])

# Issue endpoints
api_router.include_router(issues.router, tags=["issues"])

# Comment endpoints
api_router.include_router(comments.router, tags=["comments"])

# Health check
@api_router.get("/health")
def health_check():
    return {"status": "healthy"}
