from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_project_member, require_project_maintainer
from app.db.base import get_db
from app.models import User, Project, ProjectMember, MemberRole, Issue
from app.schemas.project import (
    ProjectCreate, 
    Project as ProjectSchema,
    ProjectList,
    AddProjectMember,
    ProjectMemberInfo
)

router = APIRouter()

@router.post("", response_model=ProjectSchema)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if project key already exists
    existing_project = db.query(Project).filter(Project.key == project_data.key).first()
    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project key already exists"
        )
    
    # Create project
    project = Project(
        name=project_data.name,
        key=project_data.key.upper(),
        description=project_data.description
    )
    db.add(project)
    db.flush()
    
    # Add creator as maintainer
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=MemberRole.maintainer
    )
    db.add(member)
    
    db.commit()
    db.refresh(project)
    
    return project

@router.get("", response_model=List[ProjectList])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get projects the user is a member of
    projects = db.query(Project).join(ProjectMember).filter(
        ProjectMember.user_id == current_user.id
    ).all()
    
    # Add issue and member counts
    result = []
    for project in projects:
        issue_count = db.query(Issue).filter(Issue.project_id == project.id).count()
        member_count = db.query(ProjectMember).filter(ProjectMember.project_id == project.id).count()
        
        project_dict = {
            "id": project.id,
            "name": project.name,
            "key": project.key,
            "description": project.description,
            "created_at": project.created_at,
            "issue_count": issue_count,
            "member_count": member_count
        }
        result.append(ProjectList(**project_dict))
    
    return result

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    member: ProjectMember = Depends(get_project_member)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get members with user info
    members_data = []
    for pm in project.members:
        members_data.append({
            "user": pm.user,
            "role": pm.role
        })
    
    project_dict = {
        "id": project.id,
        "name": project.name,
        "key": project.key,
        "description": project.description,
        "created_at": project.created_at,
        "members": members_data
    }
    
    return ProjectSchema(**project_dict)

@router.post("/{project_id}/members", response_model=dict)
def add_project_member(
    project_id: int,
    member_data: AddProjectMember,
    db: Session = Depends(get_db),
    maintainer: ProjectMember = Depends(require_project_maintainer)
):
    # Find user by email
    user = db.query(User).filter(User.email == member_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )
    
    # Check if already a member
    existing_member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user.id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project"
        )
    
    # Add member
    new_member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=member_data.role
    )
    db.add(new_member)
    db.commit()
    
    return {"message": "Member added successfully"}
