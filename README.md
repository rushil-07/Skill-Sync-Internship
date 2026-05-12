# SkillSync

SkillSync is an AI-assisted project and workforce management platform for matching people to projects, assembling teams, assigning tasks, tracking project health, and supporting team collaboration.

## Features

- Role-based dashboards for Admin, Project Manager, and Member users
- Authentication with login, registration, forgot password, and reset password flows
- Project creation, editing, status tracking, milestones, skills, and team management
- AI project brief parser with PDF/DOCX/TXT/MD upload support
- Smart team assembly with accept, modify, and reject flows
- Skill-based project matching with express-interest support
- Dynamic task assignment with manual approval, auto-assign mode, and overload redistribution suggestions
- Predictive project analytics with alerts, dismiss/take-action flows, and trend history
- Skill gap detection with learning recommendations, progress tracking, and automatic skill updates
- Task board with kanban, list, calendar, subtasks, comments, timers, and assignee suggestions
- Project group chat and direct one-to-one messaging
- Notification center with notification preferences
- Global search across projects, tasks, and users

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO client

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Socket.IO
- Multer, Mammoth, and PDF parsing for project brief uploads
- Gemini API for structured AI project brief parsing

## Project Structure

```text
Skill-Sync-Demo/
  backend/
    src/
      controllers/
      middlewares/
      models/
      routes/
      services/
    scripts/
    server.js
    .env.example
  frontend/
    src/
      components/
      pages/
      utils/
    vite.config.js
  README.md
```

## Prerequisites

- Node.js
- npm
- MongoDB Atlas or local MongoDB
- Gemini API key from Google AI Studio
- Gmail app password or SMTP credentials for password reset emails

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

```env
PORT=3000
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret

EMAIL_SERVICE=gmail
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Never commit real `.env` files or real API keys to GitHub.

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Build

Build the frontend:

```bash
cd frontend
npm run build
```

## Important Security Note

If any credential was exposed during development, rotate it before pushing or deploying:

- MongoDB password
- Gemini API key
- JWT secret
- Email app password or SMTP password

Only keep real credentials in local `.env` files or deployment environment variables.

## Status

This project implements the major functional modules from the SkillSync SRS, including AI-assisted project parsing, matching, team assembly, task assignment, predictive analytics, collaboration, notifications, and search.
