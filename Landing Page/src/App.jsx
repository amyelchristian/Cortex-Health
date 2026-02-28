import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProblemStatement from './components/ProblemStatement'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import DashboardPreview from './components/DashboardPreview'
import Validation from './components/Validation'
import TechStack from './components/TechStack'
import FAQ from './components/FAQ'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

// Lazy-load the Dashboard — only fetched when user navigates to /dashboard
const Dashboard = lazy(() => import('./components/Dashboard'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))

// Simple fallback skeleton while Dashboard chunk is loading on first visit
const DashboardFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f2f5' }}>
    <div className="text-center">
      <div className="w-12 h-12 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin"
        style={{ borderColor: '#00DAAA', borderTopColor: 'transparent' }} />
      <p className="text-gray-500 text-sm font-inter">Loading dashboard…</p>
    </div>
  </div>
)

// Protected route wrapper — checks auth
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <DashboardFallback />;
  if (!currentUser) return <Navigate to="/" replace />;

  return children;
}

// Redirect authenticated users away from auth pages to dashboard
function AuthRedirect({ children }) {
  const { currentUser, loading } = useAuth();

  // Show landing page immediately while auth loads — don't block with null
  if (loading) return children;

  if (currentUser) {
    return <Navigate to="/dashboard?tab=home" replace />;
  }

  return children;
}

// Landing page layout
function LandingPage({ onOpenAuth }) {
  return (
    <div className="min-h-screen text-white font-inter relative">
      <Navbar onOpenAuth={onOpenAuth} />
      <main>
        <Hero onOpenAuth={onOpenAuth} />
        <ProblemStatement />
        <HowItWorks />
        <Features />
        <DashboardPreview />
        <Validation />
        <TechStack />
        <FAQ />
        <FinalCTA onOpenAuth={onOpenAuth} />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <AuthProvider>
      <Routes>
        {/* Landing page — redirects verified users to dashboard */}
        <Route
          path="/"
          element={
            <AuthRedirect>
              <LandingPage onOpenAuth={openAuthModal} />
              <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
              />
            </AuthRedirect>
          }
        />

        {/* Forgot Password Page - Redirects verified users to dashboard */}
        <Route
          path="/forgot-password"
          element={
            <AuthRedirect>
              <Suspense fallback={<DashboardFallback />}>
                <ForgotPasswordPage />
              </Suspense>
            </AuthRedirect>
          }
        />

        {/* Protected Dashboard — lazy loaded */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<DashboardFallback />}>
                <div className="min-h-screen flex flex-col items-center"
                  style={{ background: '#fff' }}>
                  <Dashboard />
                </div>
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
