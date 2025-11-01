from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.core.deps import get_current_user, get_project_member, require_project_maintainer
from app.db.base import get_db
from app.models import User, Project, Issue, Comment, ProjectMember, MemberRole, IssueStatus, IssuePriority
from app.schemas.issue import (
    IssueCreate,
    IssueUpdate,
    Issue as IssueSchema,
    IssueList,
    IssueFilter
)

router = APIRouter()

@router.post("/projects/{project_id}/issues", response_model=IssueSchema)
def create_issue(
    project_id: int,
    issue_data: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    member: ProjectMember = Depends(get_project_member)
):
    # Verify assignee is a project member if provided
    if issue_data.assignee_id:
        assignee_member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == issue_data.assignee_id
        ).first()
        
        if not assignee_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignee must be a project member"
            )
    
    # Create issue
    issue = Issue(
        project_id=project_id,
        title=issue_data.title,
        description=issue_data.description,
        priority=issue_data.priority,
        status=IssueStatus.open,
        reporter_id=current_user.id,
        assignee_id=issue_data.assignee_id,
        expected_completion_date=issue_data.expected_completion_date
    )
    
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    # Load relationships
    issue = db.query(Issue).options(
        joinedload(Issue.reporter),
        joinedload(Issue.assignee)
    ).filter(Issue.id == issue.id).first()
    
    return issue

@router.get("/projects/{project_id}/issues", response_model=List[IssueList])
def list_issues(
    project_id: int,
    q: Optional[str] = Query(None, description="Search in title"),
    status: Optional[IssueStatus] = None,
    priority: Optional[IssuePriority] = None,
    assignee_id: Optional[int] = None,
    sort: str = Query("created_at", regex="^(created_at|priority|status|updated_at)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    member: ProjectMember = Depends(get_project_member)
):
    # Base query
    query = db.query(Issue).filter(Issue.project_id == project_id)
    
    # Apply filters
    if q:
        query = query.filter(Issue.title.ilike(f"%{q}%"))
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    if assignee_id:
        query = query.filter(Issue.assignee_id == assignee_id)
    
    # Apply sorting
    sort_column = getattr(Issue, sort)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Pagination
    offset = (page - 1) * per_page
    issues = query.options(
        joinedload(Issue.reporter),
        joinedload(Issue.assignee)
    ).offset(offset).limit(per_page).all()
    
    # Add comment count
    result = []
    for issue in issues:
        comment_count = db.query(Comment).filter(Comment.issue_id == issue.id).count()
        
        issue_dict = {
            "id": issue.id,
            "project_id": issue.project_id,
            "title": issue.title,
            "status": issue.status,
            "priority": issue.priority,
            "reporter": issue.reporter,
            "assignee": issue.assignee,
            "expected_completion_date": issue.expected_completion_date,
            "created_at": issue.created_at,
            "updated_at": issue.updated_at,
            "comment_count": comment_count
        }
        result.append(IssueList(**issue_dict))
    
    return result

@router.get("/issues/{issue_id}", response_model=IssueSchema)
def get_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).options(
        joinedload(Issue.reporter),
        joinedload(Issue.assignee)
    ).filter(Issue.id == issue_id).first()
    
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
    
    comment_count = db.query(Comment).filter(Comment.issue_id == issue.id).count()
    
    issue_dict = issue.__dict__.copy()
    issue_dict["comment_count"] = comment_count
    
    return IssueSchema(**issue_dict)

@router.patch("/issues/{issue_id}", response_model=IssueSchema)
def update_issue(
    issue_id: int,
    issue_update: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check if user is a member
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == issue.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    
    # Check permissions for certain updates
    if issue_update.status or issue_update.assignee_id is not None:
        if member.role != MemberRole.maintainer and issue.reporter_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only project maintainers or the reporter can change status/assignee"
            )
    
    # Verify new assignee is a project member
    if issue_update.assignee_id is not None:
        if issue_update.assignee_id:  # If not None and not 0
            assignee_member = db.query(ProjectMember).filter(
                ProjectMember.project_id == issue.project_id,
                ProjectMember.user_id == issue_update.assignee_id
            ).first()
            
            if not assignee_member:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Assignee must be a project member"
                )
    
    # Update fields
    update_data = issue_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(issue, field, value)
    
    db.commit()
    db.refresh(issue)
    
    # Reload with relationships
    issue = db.query(Issue).options(
        joinedload(Issue.reporter),
        joinedload(Issue.assignee)
    ).filter(Issue.id == issue_id).first()
    
    return issue

@router.delete("/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    # Check if user is a maintainer or the reporter
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == issue.project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project"
        )
    
    if member.role != MemberRole.maintainer and issue.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project maintainers or the reporter can delete this issue"
        )
    
    db.delete(issue)
    db.commit()
    
    return None
