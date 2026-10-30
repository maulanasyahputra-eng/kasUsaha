import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import { Section, Toast } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doLogin = useMutation({
    mutationFn: async () =>
      (await api.post("/auth/login", { email, password })).data,
    onSuccess: (d) => {
      login(d.token, d.user);
      navigate(d.user.role === "ADMIN" ? "/admin" : "/dashboard");
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <Section title="Login" subtitle="Masuk ke akun NEXORA DIGITAL Anda.">
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <form
        className="glass-card mx-auto max-w-sm space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          doLogin.mutate();
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Password
          </label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" disabled={doLogin.isPending}>
          {doLogin.isPending ? "Memproses..." : "Login"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link to="/daftar" className="text-neon hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </Section>
  );
}
