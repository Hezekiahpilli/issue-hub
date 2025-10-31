from fastapi import APIRouter, Depends

from app.api.endpoints import auth, projects, issues, comments
from app.core.deps import get_current_user
from app.models import User
from app.schemas.user import User as UserSchema

api_router = APIRouter()

# Auth endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# User profile endpoint (at root level)
@api_router.get("/me", response_model=UserSchema)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

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
