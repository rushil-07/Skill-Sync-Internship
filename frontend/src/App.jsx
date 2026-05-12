import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import axios from 'axios'
import AppNavbar from './components/AppNavbar'

const API = 'http://localhost:3000'

const HeroSection = lazy(() => import('./pages/HeroSection'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const TeamsPage = lazy(() => import('./pages/TeamsPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))

const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'))
const MemberProfile = lazy(() => import('./pages/member/MemberProfile'))
const PMDashboard = lazy(() => import('./pages/pm/PMDashboard'))
const PMProfile = lazy(() => import('./pages/pm/PMProfile'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'))

const ProjectsPage = lazy(() => import('./pages/project/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/project/ProjectDetailPage'))
const ProjectViews = lazy(() => import('./pages/project/ProjectViews'))
const MilestonesPage = lazy(() => import('./pages/project/MilestonePage'))
const ProjectDashboard = lazy(() => import('./pages/project/ProjectDashboard'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))

const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))

function AuthLayout({ children }) {
  return (
    <>
      <AppNavbar />
      <div className="auth-shell pt-14">{children}</div>
    </>
  )
}

function RouteLoader() {
  return (
    <div className="min-h-screen bg-[#0F2027]">
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(62,224,127,0.2)] border-t-[#3EE07F]" />
          <span className="text-[13px] text-[#7BAF8E]">Loading page...</span>
        </div>
      </div>
    </div>
  )
}

function renderLazyPage(element, useShell = false) {
  const content = <Suspense fallback={<RouteLoader />}>{element}</Suspense>
  return useShell ? <AuthLayout>{content}</AuthLayout> : content
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    axios
      .get(`${API}/api/profile/me`, { withCredentials: true })
      .then((res) => setCurrentUser(res.data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  if (!authChecked) return null

  return (
    <Routes>
      <Route path="/" element={renderLazyPage(<HeroSection />)} />
      <Route path="/features" element={renderLazyPage(<FeaturesPage />)} />
      <Route path="/how-it-works" element={renderLazyPage(<HowItWorksPage />)} />
      <Route path="/teams" element={renderLazyPage(<TeamsPage />)} />

      <Route path="/login" element={renderLazyPage(<LoginPage />)} />
      <Route path="/register" element={renderLazyPage(<RegisterPage />)} />
      <Route path="/forgot-password" element={renderLazyPage(<ForgotPasswordPage />)} />
      <Route path="/reset-password" element={renderLazyPage(<ResetPasswordPage />)} />

      <Route path="/dashboard" element={renderLazyPage(<MemberDashboard />, true)} />
      <Route path="/profile" element={renderLazyPage(<MemberProfile />, true)} />
      <Route path="/member/projects/:id" element={renderLazyPage(<ProjectDetailPage />, true)} />
      <Route path="/member/projects/:projectId/tasks" element={renderLazyPage(<ProjectViews />, true)} />
      <Route path="/member/projects/:projectId/milestones" element={renderLazyPage(<MilestonesPage />, true)} />
      <Route path="/member/projects/:projectId/skills" element={renderLazyPage(<SkillsPage />, true)} />

      <Route path="/pm/dashboard" element={renderLazyPage(<PMDashboard />, true)} />
      <Route path="/pm/profile" element={renderLazyPage(<PMProfile />, true)} />
      <Route path="/pm/profile/:userId" element={renderLazyPage(<PMProfile />, true)} />
      <Route path="/pm/projects" element={renderLazyPage(<ProjectsPage />, true)} />
      <Route path="/pm/projects/:id" element={renderLazyPage(<ProjectDetailPage />, true)} />
      <Route path="/pm/projects/:projectId/tasks" element={renderLazyPage(<ProjectViews />, true)} />
      <Route path="/pm/projects/:projectId/milestones" element={renderLazyPage(<MilestonesPage />, true)} />
      <Route path="/pm/projects/:projectId/skills" element={renderLazyPage(<SkillsPage />, true)} />
      <Route path="/pm/projects/:projectId/dashboard" element={renderLazyPage(<ProjectDashboard />, true)} />

      <Route path="/admin/dashboard" element={renderLazyPage(<AdminDashboard />, true)} />
      <Route path="/admin/profile" element={renderLazyPage(<AdminProfile />, true)} />
      <Route path="/admin/profile/:userId" element={renderLazyPage(<AdminProfile />, true)} />
      <Route path="/admin/skills" element={renderLazyPage(<SkillsPage />, true)} />
      <Route path="/admin/projects/:id" element={renderLazyPage(<ProjectDetailPage />, true)} />
      <Route path="/admin/projects/:projectId/tasks" element={renderLazyPage(<ProjectViews />, true)} />
      <Route path="/admin/projects/:projectId/milestones" element={renderLazyPage(<MilestonesPage />, true)} />
      <Route path="/admin/projects/:projectId/skills" element={renderLazyPage(<SkillsPage />, true)} />
      <Route path="/admin/projects/:projectId/dashboard" element={renderLazyPage(<ProjectDashboard />, true)} />

      <Route
        path="/notifications"
        element={renderLazyPage(<NotificationsPage userId={currentUser?._id} role={currentUser?.role} />, true)}
      />
      <Route path="/messages" element={renderLazyPage(<MessagesPage />, true)} />
      <Route path="/search" element={renderLazyPage(<SearchPage />, true)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
