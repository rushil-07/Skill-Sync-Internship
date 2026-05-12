import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/')

          if (normalized.includes('node_modules')) return 'vendor'

          if (normalized.includes('/src/pages/project/')) return 'pages-project'
          if (normalized.includes('/src/pages/pm/')) return 'pages-pm'
          if (normalized.includes('/src/pages/member/')) return 'pages-member'
          if (normalized.includes('/src/pages/admin/')) return 'pages-admin'
          if (
            normalized.includes('/src/pages/LoginPage') ||
            normalized.includes('/src/pages/RegisterPage') ||
            normalized.includes('/src/pages/ForgotPasswordPage') ||
            normalized.includes('/src/pages/ResetPasswordPage')
          ) return 'pages-auth'
          if (
            normalized.includes('/src/pages/HeroSection') ||
            normalized.includes('/src/pages/FeaturesPage') ||
            normalized.includes('/src/pages/HowItWorksPage') ||
            normalized.includes('/src/pages/TeamsPage')
          ) return 'pages-public'
          if (
            normalized.includes('/src/pages/NotificationsPage') ||
            normalized.includes('/src/pages/SearchPage') ||
            normalized.includes('/src/pages/MessagesPage') ||
            normalized.includes('/src/pages/SkillsPage')
          ) return 'pages-shared'

          return 'vendor'
        },
      },
    },
  },
})
