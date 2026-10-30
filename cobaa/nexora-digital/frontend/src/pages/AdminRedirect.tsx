import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Section } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

/** Redirect pintasan /admin-* ke dashboard admin. */
export default function AdminRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading)
      navigate(user?.role === "ADMIN" ? "/admin" : "/login", { replace: true });
  }, [user, loading, navigate]);
  return (
    <Section title="Mengalihkan...">
      <div className="skeleton h-40" />
    </Section>
  );
}
