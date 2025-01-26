import { useAuth0 } from "@auth0/auth0-react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export default function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth0();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/signin");
    return null;
  }

  return <Component />;
}