from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

from app.schemas.user import User
from app.models.project_member import MemberRole

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    key: str = Field(..., min_length=1, max_length=10)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class ProjectMemberInfo(BaseModel):
    user: User
    role: MemberRole
    
    class Config:
        from_attributes = True

class Project(ProjectBase):
    id: int
    created_at: datetime
    members: Optional[List[ProjectMemberInfo]] = []
    
    class Config:
        from_attributes = True

class ProjectList(ProjectBase):
    id: int
    created_at: datetime
    issue_count: Optional[int] = 0
    member_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class AddProjectMember(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.member
