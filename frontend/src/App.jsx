import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./ContextAPI/AuthContext";
import LandingPage from "./components/pages/LandingPage";
import Dashboard from "./components/pages/Dashboard";
import ProtectedRoute from "./components/utils/ProtectedRoute";
import OAuthCallbackHandler from "./components/utils/OAuthCallbackHandler";
import { TransactionProvider } from "./ContextAPI/TransactionContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AnalyticsProvider } from "./ContextAPI/AnalyticsContext";

function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <AnalyticsProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/auth/callback"
                  element={<OAuthCallbackHandler />}
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </AnalyticsProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}

export default App;
