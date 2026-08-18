"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Contraseña incorrecta.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-1">Admin</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Paquete de besos ilimitados
        </p>
        <label className="block text-xs font-semibold text-neutral-600 mb-2">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm mb-4"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-800 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
