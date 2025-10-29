from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.schemas.user import User

class CommentBase(BaseModel):
    body: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    pass

class CommentUpdate(CommentBase):
    pass

class Comment(CommentBase):
    id: int
    issue_id: int
    author_id: int
    author: Optional[User] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
