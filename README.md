# Issue Hub - Lightweight Bug Tracker

A minimal yet powerful bug tracking system built with FastAPI (Python) backend and Next.js (React) frontend. Teams can create projects, file issues, comment on them, and track status with a clean, responsive UI.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with signup/login/logout
- **Project Management**: Create and manage multiple projects with team members
- **Issue Tracking**: Full CRUD operations for issues with status and priority management
- **Comments System**: Threaded discussions on issues
- **Role-Based Access**: Project maintainers vs members with different permissions
- **Search & Filter**: Advanced filtering by status, priority, assignee with text search
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### User Roles
- **Project Member**: Can create/read/update issues they reported, comment on issues
- **Project Maintainer**: Full control over issues, can manage project membership

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework with automatic API documentation
- **SQLAlchemy**: ORM with support for both SQLite and PostgreSQL
- **Alembic**: Database migrations
- **Pydantic**: Data validation and serialization
- **JWT**: Secure token-based authentication
- **Pytest**: Testing framework

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form handling with validation
- **Zustand**: State management
- **Axios**: HTTP client
- **React Hot Toast**: Notifications

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (optional, SQLite works for development)

## 🔧 Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run database migrations:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

6. (Optional) Seed the database with demo data:
```bash
python scripts/seed.py
```

7. Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

### Backend Tests

Run the test suite:
```bash
cd backend
pytest tests/ -v
```

Run with coverage:
```bash
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📝 API Documentation

The API follows RESTful conventions with the following endpoints:

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/me` - Get current user profile

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - List user's projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects/{id}/members` - Add project member

### Issues
- `POST /api/projects/{id}/issues` - Create issue
- `GET /api/projects/{id}/issues` - List project issues with filters
- `GET /api/issues/{id}` - Get issue details
- `PATCH /api/issues/{id}` - Update issue
- `DELETE /api/issues/{id}` - Delete issue

### Comments
- `GET /api/issues/{id}/comments` - List issue comments
- `POST /api/issues/{id}/comments` - Add comment

## 🎯 Demo Accounts

After running the seed script, you can use these demo accounts:

- **demo@example.com / demo123** - Member/Maintainer in both sample projects
- **john@example.com / password123** - Maintainer in Web Platform project
- **jane@example.com / password123** - Maintainer in both projects
- **bob@example.com / password123** - Member in Web Platform project
- **alice@example.com / password123** - Member in Mobile App project

## 🏗 Project Structure

```
issue-hub/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality (security, config)
│   │   ├── db/           # Database configuration
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── main.py       # FastAPI app
│   ├── tests/            # Test suite
│   ├── scripts/          # Utility scripts
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/        # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities and API client
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript types
│   │   └── styles/       # Global styles
│   ├── public/           # Static assets
│   └── package.json
│
└── README.md
```

## 🚀 Deployment

### Backend Deployment

For production, use a proper ASGI server:

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment

Build for production:

```bash
cd frontend
npm run build
npm run start
```

Or deploy to Vercel:
```bash
npx vercel
```

## 🔐 Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days (configurable)
- Input validation on all endpoints
- CORS configuration for production
- SQL injection protection via SQLAlchemy ORM
- XSS protection in React

## 📈 Performance Optimizations

- Database indexes on frequently queried fields
- Pagination for issue lists
- Lazy loading of relationships
- Frontend caching with React Query (can be added)
- Static generation for public pages

## 🤝 Trade-offs & Decisions

### Architecture Decisions

1. **FastAPI over Django/Flask**: Chosen for modern async support, automatic API documentation, and excellent performance
2. **SQLAlchemy over Django ORM**: More flexible and database-agnostic
3. **JWT over Sessions**: Stateless authentication for better scalability
4. **Next.js over Create React App**: SSR capabilities and better SEO
5. **Zustand over Redux**: Simpler state management for this scale

### Known Limitations

1. No email notifications (can be added with Celery + Redis)
2. No file attachments (can be added with S3 integration)
3. Basic search (can be enhanced with PostgreSQL full-text search)
4. No real-time updates (can be added with WebSockets)
5. Limited to two role types (can be expanded)

## 🔮 Future Enhancements

With more time, I would add:

1. **Real-time Updates**: WebSocket integration for live issue updates
2. **Email Notifications**: Celery task queue for async email sending
3. **File Attachments**: S3 integration for file uploads
4. **Advanced Search**: Elasticsearch integration
5. **Activity Feed**: Track all project activities
6. **Bulk Operations**: Select and update multiple issues
7. **Custom Fields**: Allow projects to define custom issue fields
8. **Time Tracking**: Log time spent on issues
9. **Reporting**: Analytics and charts for project metrics
10. **API Rate Limiting**: Protect against abuse
11. **Two-Factor Authentication**: Enhanced security
12. **Audit Logs**: Track all system changes
13. **Markdown Support**: Rich text editing for descriptions and comments
14. **Issue Templates**: Predefined templates for common issue types
15. **Webhooks**: Integration with external services

## 📄 License

MIT License - feel free to use this project for any purpose.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- FastAPI documentation and community
- Next.js and Vercel team
- Tailwind CSS for the beautiful UI components
- All open-source contributors

---

**Note**: This is a demonstration project showcasing full-stack development skills with modern Python and React ecosystems. Production deployment would require additional security hardening, monitoring, and scalability considerations.
