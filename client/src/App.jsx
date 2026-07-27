import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import ChatPage from "./pages/ChatPage";
import WidgetPage from "./pages/WidgetPage";
import {
  AnalyticsPage,
  BillingPage,
  LogsPage,
  RagPipelinePage,
  SettingsPage,
  WidgetEmbedPage,
} from "./pages/SystemPages";
import { PrivacyPolicyPage, TermsOfServicePage, SecurityStatementPage } from "./pages/LegalPages";
import ProtectedRoute from "./components/ProtectedRoute";

const protectedModuleRoutes = [
  { path: "/rag-pipeline", Component: RagPipelinePage },
  { path: "/analytics", Component: AnalyticsPage },
  { path: "/widget-embed", Component: WidgetEmbedPage },
  { path: "/logs", Component: LogsPage },
  { path: "/billing", Component: BillingPage },
  { path: "/settings", Component: SettingsPage },
];

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/security" element={<SecurityStatementPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      {protectedModuleRoutes.map(({ path, Component }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <Component />
            </ProtectedRoute>
          }
        />
      ))}

      {/* Widget Route - Completely public, no auth layout */}
      <Route path="/widget/:companyId" element={<WidgetPage />} />

      {/* Catch-all: redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
