from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.models.issue import IssueStatus, IssuePriority
from app.schemas.user import User

class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: IssuePriority = IssuePriority.medium
    assignee_id: Optional[int] = None
    expected_completion_date: Optional[datetime] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None
    expected_completion_date: Optional[datetime] = None

class Issue(IssueBase):
    id: int
    project_id: int
    status: IssueStatus
    reporter_id: int
    reporter: Optional[User] = None
    assignee: Optional[User] = None
    expected_completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comment_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class IssueList(BaseModel):
    id: int
    project_id: int
    title: str
    status: IssueStatus
    priority: IssuePriority
    reporter: User
    assignee: Optional[User] = None
    expected_completion_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comment_count: int = 0
    
    class Config:
        from_attributes = True

class IssueFilter(BaseModel):
    q: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assignee_id: Optional[int] = None
    sort: Optional[str] = "created_at"
    order: Optional[str] = "desc"
    page: int = 1
    per_page: int = 20
