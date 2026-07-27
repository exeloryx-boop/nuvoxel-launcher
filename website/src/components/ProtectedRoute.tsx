import { Navigate, useLocation } from "react-router-dom";
import { useWebsiteStore } from "../store/useWebsiteStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useWebsiteStore((s) => s.auth);
  const location = useLocation();

  if (!auth?.loggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
