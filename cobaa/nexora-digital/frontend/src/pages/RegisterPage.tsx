import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import { Section, Toast } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [toast, setToast] = useState<{
    msg: string;
    type: "error" | "success";
  } | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const doRegister = useMutation({
    mutationFn: async () => (await api.post("/auth/register", form)).data,
    onSuccess: (d) => {
      login(d.token, d.user);
      navigate("/dashboard");
    },
    onError: (e) => setToast({ msg: apiErrorMessage(e), type: "error" }),
  });

  return (
    <Section
      title="Daftar"
      subtitle="Buat akun untuk riwayat transaksi, saldo, dan notifikasi."
    >
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <form
        className="glass-card mx-auto max-w-sm space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          doRegister.mutate();
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Nama</label>
          <input
            className="input"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">Email</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-slate-300">
            Password (min. 8 karakter)
          </label>
          <input
            className="input"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn-primary w-full" disabled={doRegister.isPending}>
          {doRegister.isPending ? "Memproses..." : "Daftar"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-neon hover:underline">
            Login
          </Link>
        </p>
      </form>
    </Section>
  );
}
