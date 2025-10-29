from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.db.base import get_db
from app.models import User, Issue, Comment, ProjectMember
from app.schemas.comment import CommentCreate, Comment as CommentSchema

router = APIRouter()

@router.get("/issues/{issue_id}/comments", response_model=List[CommentSchema])
def list_comments(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if issue exists
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check if user is a member of the project
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == issue.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    
    # Get comments with author info
    comments = db.query(Comment).options(
        joinedload(Comment.author)
    ).filter(Comment.issue_id == issue_id).order_by(Comment.created_at).all()
    
    return comments

@router.post("/issues/{issue_id}/comments", response_model=CommentSchema)
def create_comment(
    issue_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if issue exists
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check if user is a member of the project
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == issue.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    
    # Create comment
    comment = Comment(
        issue_id=issue_id,
        author_id=current_user.id,
        body=comment_data.body
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Load with author
    comment = db.query(Comment).options(
        joinedload(Comment.author)
    ).filter(Comment.id == comment.id).first()
    
    return comment
