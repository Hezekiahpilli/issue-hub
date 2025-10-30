import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.base import Base, get_engine, get_session_local
from app.models import User, Project, ProjectMember, Issue, Comment, MemberRole, IssueStatus, IssuePriority
from app.core.security import get_password_hash

def seed_database():
    # Create tables
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = get_session_local()
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Database already seeded!")
            return
        
        print("Seeding database...")
        
        # Create users
        users = [
            User(name="John Doe", email="john@example.com", password_hash=get_password_hash("password123")),
            User(name="Jane Smith", email="jane@example.com", password_hash=get_password_hash("password123")),
            User(name="Bob Johnson", email="bob@example.com", password_hash=get_password_hash("password123")),
            User(name="Alice Williams", email="alice@example.com", password_hash=get_password_hash("password123")),
            User(name="Demo User", email="demo@example.com", password_hash=get_password_hash("demo123"))
        ]
        
        for user in users:
            db.add(user)
        db.flush()
        
        # Create projects
        projects = [
            Project(name="Web Platform", key="WEB", description="Main web application platform"),
            Project(name="Mobile App", key="MOB", description="Mobile application for iOS and Android")
        ]
        
        for project in projects:
            db.add(project)
        db.flush()
        
        # Add project members
        # Project 1: John (maintainer), Jane (maintainer), Bob (member), Demo (member)
        db.add(ProjectMember(project_id=projects[0].id, user_id=users[0].id, role=MemberRole.maintainer))
        db.add(ProjectMember(project_id=projects[0].id, user_id=users[1].id, role=MemberRole.maintainer))
        db.add(ProjectMember(project_id=projects[0].id, user_id=users[2].id, role=MemberRole.member))
        db.add(ProjectMember(project_id=projects[0].id, user_id=users[4].id, role=MemberRole.member))
        
        # Project 2: Jane (maintainer), Alice (member), Demo (maintainer)
        db.add(ProjectMember(project_id=projects[1].id, user_id=users[1].id, role=MemberRole.maintainer))
        db.add(ProjectMember(project_id=projects[1].id, user_id=users[3].id, role=MemberRole.member))
        db.add(ProjectMember(project_id=projects[1].id, user_id=users[4].id, role=MemberRole.maintainer))
        
        db.flush()
        
        # Create issues for Project 1
        web_issues = [
            Issue(
                project_id=projects[0].id,
                title="Login page not responsive on mobile",
                description="The login page doesn't adapt properly to mobile screen sizes. Elements overlap and form fields are cut off.",
                status=IssueStatus.open,
                priority=IssuePriority.high,
                reporter_id=users[2].id,
                assignee_id=users[0].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Add dark mode support",
                description="Users have requested a dark mode option for better visibility in low-light conditions.",
                status=IssueStatus.in_progress,
                priority=IssuePriority.medium,
                reporter_id=users[0].id,
                assignee_id=users[1].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Performance issues with large datasets",
                description="Page load times increase significantly when displaying tables with more than 1000 rows.",
                status=IssueStatus.open,
                priority=IssuePriority.critical,
                reporter_id=users[1].id,
                assignee_id=users[0].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Export to CSV feature broken",
                description="The export functionality throws an error when trying to export data to CSV format.",
                status=IssueStatus.resolved,
                priority=IssuePriority.high,
                reporter_id=users[4].id,
                assignee_id=users[1].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Update documentation for API v2",
                description="API documentation needs to be updated to reflect changes in version 2.0.",
                status=IssueStatus.open,
                priority=IssuePriority.low,
                reporter_id=users[0].id,
                assignee_id=None
            ),
            Issue(
                project_id=projects[0].id,
                title="Implement two-factor authentication",
                description="Add 2FA support for enhanced security.",
                status=IssueStatus.open,
                priority=IssuePriority.high,
                reporter_id=users[1].id,
                assignee_id=users[0].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Search functionality returns incorrect results",
                description="Search feature is not properly filtering results based on the search criteria.",
                status=IssueStatus.in_progress,
                priority=IssuePriority.medium,
                reporter_id=users[2].id,
                assignee_id=users[1].id
            ),
            Issue(
                project_id=projects[0].id,
                title="Add user activity logging",
                description="Implement comprehensive logging for user actions for audit purposes.",
                status=IssueStatus.open,
                priority=IssuePriority.medium,
                reporter_id=users[4].id,
                assignee_id=None
            )
        ]
        
        for issue in web_issues:
            db.add(issue)
        db.flush()
        
        # Create issues for Project 2
        mobile_issues = [
            Issue(
                project_id=projects[1].id,
                title="App crashes on startup on iOS 15",
                description="Multiple users report the app crashing immediately after launch on iOS 15 devices.",
                status=IssueStatus.open,
                priority=IssuePriority.critical,
                reporter_id=users[3].id,
                assignee_id=users[1].id
            ),
            Issue(
                project_id=projects[1].id,
                title="Push notifications not working on Android",
                description="Push notifications are not being received on Android devices running version 12 and above.",
                status=IssueStatus.open,
                priority=IssuePriority.high,
                reporter_id=users[1].id,
                assignee_id=users[3].id
            ),
            Issue(
                project_id=projects[1].id,
                title="Add offline mode support",
                description="Allow users to access cached content when offline.",
                status=IssueStatus.open,
                priority=IssuePriority.medium,
                reporter_id=users[4].id,
                assignee_id=None
            ),
            Issue(
                project_id=projects[1].id,
                title="Improve app launch time",
                description="App takes too long to load on older devices.",
                status=IssueStatus.in_progress,
                priority=IssuePriority.medium,
                reporter_id=users[3].id,
                assignee_id=users[1].id
            ),
            Issue(
                project_id=projects[1].id,
                title="Add biometric authentication",
                description="Support Face ID and Touch ID for iOS, and fingerprint authentication for Android.",
                status=IssueStatus.closed,
                priority=IssuePriority.high,
                reporter_id=users[1].id,
                assignee_id=users[3].id
            )
        ]
        
        for issue in mobile_issues:
            db.add(issue)
        db.flush()
        
        # Add comments to some issues
        comments = [
            Comment(
                issue_id=web_issues[0].id,
                author_id=users[0].id,
                body="I'll look into this issue. Can you provide specific device models and screen sizes where you're seeing this problem?"
            ),
            Comment(
                issue_id=web_issues[0].id,
                author_id=users[2].id,
                body="Sure! I'm seeing this on iPhone 12 mini and Samsung Galaxy S21. The login button is completely off-screen."
            ),
            Comment(
                issue_id=web_issues[1].id,
                author_id=users[1].id,
                body="I've started working on the dark mode implementation. Should have a PR ready by end of week."
            ),
            Comment(
                issue_id=web_issues[2].id,
                author_id=users[0].id,
                body="This is a critical issue. We need to implement pagination or virtual scrolling ASAP."
            ),
            Comment(
                issue_id=web_issues[2].id,
                author_id=users[1].id,
                body="I agree. I can help with the backend pagination implementation."
            ),
            Comment(
                issue_id=mobile_issues[0].id,
                author_id=users[1].id,
                body="I've identified the issue. It's related to a deprecated API call. Working on a fix now."
            ),
            Comment(
                issue_id=mobile_issues[0].id,
                author_id=users[3].id,
                body="Great! This is affecting a lot of users. Please prioritize this."
            )
        ]
        
        for comment in comments:
            db.add(comment)
        
        db.commit()
        print("Database seeded successfully!")
        print("\nDemo accounts created:")
        print("  Email: demo@example.com | Password: demo123 (Member/Maintainer in both projects)")
        print("  Email: john@example.com | Password: password123 (Maintainer in Web Platform)")
        print("  Email: jane@example.com | Password: password123 (Maintainer in both projects)")
        print("  Email: bob@example.com | Password: password123 (Member in Web Platform)")
        print("  Email: alice@example.com | Password: password123 (Member in Mobile App)")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
