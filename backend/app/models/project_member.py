from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base

class MemberRole(str, enum.Enum):
    member = "member"
    maintainer = "maintainer"

class ProjectMember(Base):
    __tablename__ = "project_members"
    
    project_id = Column(Integer, ForeignKey("projects.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role = Column(Enum(MemberRole), nullable=False, default=MemberRole.member)
    
    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")
