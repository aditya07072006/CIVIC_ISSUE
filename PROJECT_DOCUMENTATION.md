# Civic Issue Portal - Detailed Project Documentation

## 1. Project Summary
Civic Issue Portal is a full-stack municipal issue reporting and management platform.
It supports three major workflows:

1. Citizen workflow: register, login, report issues, track personal issues, give feedback.
2. Admin workflow: monitor all issues, update status, view analytics, manage deleted issues, review citizen feedback.
3. Public transparency workflow: view public issues with filters, sorting, ratings, and analytics charts.

The project is built with a modern React frontend and a Flask REST backend, connected to MySQL.

---

## 2. Technology Stack

### 2.1 Frontend
- Language: JavaScript (ESM)
- Framework: React 19
- Bundler/Dev server: Vite 7
- Styling: Tailwind CSS 4 + custom gradient/glassmorphism theme
- Routing: react-router-dom
- HTTP client: axios
- Charts: Chart.js + react-chartjs-2
- Maps: Leaflet + react-leaflet + OpenStreetMap tiles
- Icons: lucide-react
- Notifications: react-hot-toast
- Utility libs: clsx, tailwind-merge, class-variance-authority
- Linting: ESLint + react-hooks + react-refresh plugins

### 2.2 Backend
- Language: Python
- Framework: Flask 3
- CORS: Flask-CORS
- Authentication: Flask-JWT-Extended (JWT token auth)
- Password hashing: bcrypt
- Database driver: PyMySQL
- MySQL auth compatibility: cryptography
- Env management: python-dotenv
- Image processing support: Pillow
- Optional cloud image storage: cloudinary
- Production WSGI server: gunicorn

### 2.3 Database
- Engine: MySQL
- Primary DB name: civic_issue_portal
- Schema source: DB.sql

---

## 3. Folder Structure

```
CIVIC_ISSUE/
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── issues.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .env / .env.example
│   ├── uploads/
│   └── Procfile
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── layout/
│       │   ├── map/
│       │   └── ui/
│       ├── pages/
│       └── utils/
├── DB.sql
├── README.md
└── PROJECT_DOCUMENTATION.md
```

---

## 4. Frontend Architecture

### 4.1 Routing and Access Control
Routes are defined in frontend/src/App.jsx.

Main routes:
- /login
- /register
- /dashboard (citizen private)
- /report (citizen private)
- /feedback (citizen private)
- /public-issues (authenticated public view)
- /admin (admin only)
- /deleted (admin only)
- /admin-feedback (admin only)

Route guards:
- ProtectedRoute blocks unauthenticated users.
- adminOnly guard blocks citizen users from admin pages.
- PublicRoute redirects logged-in users away from auth pages.

### 4.2 Authentication State
AuthContext handles:
- login(email, password)
- register(name, email, password)
- logout()
- user state persisted in localStorage

JWT token is stored in localStorage and injected into axios headers.

### 4.3 UI and Theme System
- Dark premium SaaS style
- Glass cards, gradients, glow accents, rounded layout
- Responsive sidebar + topbar app shell
- Reusable UI components for modal, badge, forms, etc.

### 4.4 Map and Location Features
- User can pin issue location on map.
- Browser geolocation supported.
- Reverse geocoding used to derive readable address from coordinates.
- Address shown in issue details for better usability.

### 4.5 Chart Features
Used in Admin/Public dashboards:
- Doughnut charts for resolution split
- Bar charts for category/severity distributions
- Trend line charts for issue volume over time

---

## 5. Backend Architecture

### 5.1 Core Files
- app.py: Flask app bootstrap, CORS, JWT init, health route, table ensure logic
- auth.py: register/login/me APIs
- issues.py: issue APIs, analytics APIs, feedback APIs, upvote APIs
- config.py: env-driven configuration
- database.py: MySQL connection helper

### 5.2 Security Model
- JWT-based stateless auth
- Password hashing with bcrypt
- Role-based authorization checks in endpoints
- Admin-only routes protected server-side

### 5.3 Image Handling
- Local mode: saves to backend/uploads
- Cloud mode: uploads to Cloudinary if CLOUDINARY vars are set

### 5.4 Table Initialization on Startup
app.py ensures these tables exist:
- issue_upvotes
- issue_feedback

This allows safer startup in environments where migrations are not run manually.

---

## 6. Database Schema

### 6.1 Main Tables
1. users
- id, name, email, password, role, created_at

2. issues
- id, title, description, category, severity
- latitude, longitude, address, image
- status, priority, sla_hours
- user_id, created_at, updated_at, deleted_at

3. issue_timeline
- issue action history with actor and timestamps

4. issue_feedback
- citizen closure feedback per issue
- unique(issue_id, user_id)
- is_satisfied, rating, comment, created_at

5. issue_upvotes
- issue popularity / community signal
- composite primary key(issue_id, user_id)

### 6.2 Important Data Rules
- deleted_at enables soft delete (not hard delete).
- feedback is restricted to issue owner and closed statuses.
- rating is stored per feedback row and used in public sorting/analytics.

---

## 7. API Endpoints (Current)

### 7.1 Auth APIs
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### 7.2 Issue APIs (private + admin)
- POST /api/issues
- GET /api/issues
- GET /api/issues/<issue_id>
- PATCH /api/issues/<issue_id>/status (admin)
- DELETE /api/issues/<issue_id> (admin, soft delete)

### 7.3 Public Discovery APIs
- GET /api/issues/public/list
  - filters: status, category, search
  - sort: newest, oldest, most_upvoted, rating_high, rating_low
- GET /api/issues/public/stats

### 7.4 Analytics and Map APIs
- GET /api/issues/analytics/stats (admin)
- GET /api/issues/analytics/trend (admin)
- GET /api/issues/map/all

### 7.5 Feedback APIs
- GET /api/issues/feedback/my (citizen)
- POST /api/issues/<issue_id>/feedback (citizen)
- GET /api/issues/feedback/all (admin)

### 7.6 Upvote APIs
- POST /api/issues/<issue_id>/upvote
- DELETE /api/issues/<issue_id>/upvote

### 7.7 Deleted Issues API
- GET /api/issues/deleted/list (admin)

### 7.8 Health API
- GET /api/health

---

## 8. Business Features Implemented

### 8.1 Citizen Features
- Registration and login
- Report issue with text + image + location pin
- My Issues (private to logged-in user)
- Status tracking and detail timeline view
- Upvote support
- Post-resolution feedback submission/update

### 8.2 Admin Features
- Full issue monitoring dashboard
- Status transitions and issue detail modal
- Analytics charts + trend visualization
- Soft delete + deleted archive page
- Feedback administration page with filters and CSV export

### 8.3 Public Features
- Public issues explorer page
- Search and multi-filter support
- Sorting by ratings and upvotes
- Public analytics cards/charts for transparency

---

## 9. SLA and Priority Logic
Configured in backend/config.py:
- Category-based SLA hours
- Severity-to-priority mapping

Example:
- critical -> emergency priority
- garbage/water leaks get tighter SLA windows

---

## 10. Deployment Readiness

### 10.1 Frontend
- Vercel config present (frontend/vercel.json)
- Production env supported via frontend/.env.production

### 10.2 Backend
- Procfile for Render/gunicorn
- Env template in backend/.env.example
- CORS allows frontend URL from env

### 10.3 Media
- Local uploads for dev
- Cloudinary integration for production persistence

---

## 11. Local Development Commands

### Backend
```powershell
Set-Location "C:\Users\adity\OneDrive\Desktop\CIVIC_ISSUE\backend"
C:/Users/adity/OneDrive/Desktop/CIVIC_ISSUE/.venv/Scripts/python.exe app.py
```

### Frontend
```powershell
Set-Location "C:\Users\adity\OneDrive\Desktop\CIVIC_ISSUE\frontend"
npm run dev
```

Open: http://localhost:5173

---

## 12. Known Environment Notes
- Use project venv Python executable directly to avoid missing package issues.
- MySQL auth may require cryptography package (already included).
- Ensure backend is running on localhost:5000 and Vite proxy is active for /api in development.

---

## 13. Suggested Future Enhancements
1. Add pagination and infinite scroll for public issues list.
2. Add comment threads per issue for citizen-admin conversation.
3. Add email/SMS notifications on status changes.
4. Add audit log dashboard for admin actions.
5. Add rate limiting and request validation schema layer.
6. Add unit/integration tests and CI pipeline.
7. Add role granularity (ward officer, super admin).
8. Add geospatial clustering and hotspot heatmaps.

---

## 14. One-Line Summary
This project is a production-oriented, role-based civic operations platform using React + Flask + MySQL, with mapping, analytics, feedback loops, and public transparency modules.
