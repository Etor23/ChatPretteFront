import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AUTH_TOKEN_KEY } from "../../services/apiService";
import { USER_KEY } from "../../services/authService";

interface PrivateRouteProps {
  children: React.ReactNode;
}

function hasBirthdate(storedJson: string | null): boolean {
  if (!storedJson) return false;
  const user = JSON.parse(storedJson);
  const raw: string | undefined = user?.birth_date ?? user?.birthDate ?? user?.birthdate;
  return !!raw && !raw.startsWith("0001-01-01");
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname !== "/edit-profile" && !hasBirthdate(localStorage.getItem(USER_KEY))) {
    return <Navigate to="/edit-profile" replace />;
  }

  return <>{children}</>;
}
