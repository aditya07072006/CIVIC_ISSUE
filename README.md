# Civic Issue Portal

A production-ready Smart City Civic Issue Management Platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, Tailwind CSS, Leaflet.js, Chart.js |
| Backend | Python Flask REST API |
| Database | MySQL (`civic_issue_portal`) |
| Auth | JWT (Flask-JWT-Extended) |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Chart.js via react-chartjs-2 |

## Project Structure

```
CIVIC_ISSUE/
├── backend/
│   ├── app.py          # Flask application entry point
│   ├── auth.py         # Register / Login / JWT endpoints
│   ├── issues.py       # Issue CRUD + analytics endpoints
│   ├── database.py     # MySQL connection helper
│   ├── config.py       # Environment configuration
│   ├── .env            # DB credentials & secrets
│   ├── uploads/        # Uploaded issue images
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/axios.js          # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── ui/               # Button, Card, Badge, Input, Modal
│   │   │   ├── layout/Navbar.jsx
│   │   │   └── map/              # MapPicker, IssueMap
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── CitizenDashboard.jsx
│   │       ├── ReportIssuePage.jsx
│   │       └── AdminDashboard.jsx
│   └── vite.config.js  # Proxy /api → :5000
├── DB.sql              # Full database schema
└── start.ps1           # One-click startup script
```

## Quick Start

### Option A – One Click
```powershell
.\start.ps1
```

### Option B – Manual

**Terminal 1 – Backend:**
```powershell
cd backend
python app.py
```

**Terminal 2 – Frontend:**
```powershell
cd frontend
npm run dev
```

Then open: **http://localhost:5173**

## Database Setup

```powershell
Get-Content DB.sql | mysql -u root -pAditya@07
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civic.gov | Admin@123 |
| Citizen | Register via UI | — |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login, get JWT |
| GET | /api/auth/me | JWT | Current user info |
| GET | /api/issues | JWT | List issues |
| POST | /api/issues | JWT | Report new issue |
| GET | /api/issues/:id | JWT | Issue detail + timeline |
| PATCH | /api/issues/:id/status | Admin | Change status |
| DELETE | /api/issues/:id | Admin | Delete issue |
| GET | /api/issues/analytics/stats | Admin | Dashboard statistics |
| GET | /api/issues/map/all | JWT | Map marker data |

## Features

- **Citizen**: Register/Login, report issues with photo + GPS, track status
- **Admin**: Full issue table, status management, analytics charts, issue map
- **Security**: JWT auth, bcrypt passwords, admin-only endpoints, file validation
- **Smart Features**: Duplicate detection (30m radius), SLA tracking per category, priority engine, activity timeline
- **Maps**: Leaflet with click-to-pick location, geolocation, severity-colored markers
- **Charts**: Status distribution (Doughnut), Issues by category (Bar)
"# CIVIC_ISSUE" 
"# CIVIC_ISSUE" 
