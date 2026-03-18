import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import ReportIssuePage from "./pages/ReportIssuePage";
import FeedbackPage from "./pages/FeedbackPage";
import PublicIssuesPage from "./pages/PublicIssuesPage";
import AdminDashboard from "./pages/AdminDashboard";
import DeletedIssuesPage from "./pages/DeletedIssuesPage";
import AdminFeedbackPage from "./pages/AdminFeedbackPage";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><CitizenDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <AppLayout><ReportIssuePage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <AppLayout><FeedbackPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/public-issues"
        element={
          <ProtectedRoute>
            <AppLayout><PublicIssuesPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deleted"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout><DeletedIssuesPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-feedback"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout><AdminFeedbackPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
