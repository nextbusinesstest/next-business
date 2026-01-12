import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";

export default function ClientLogin() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error || "Login error");

      router.push("/client/new");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  return (
    <>
      <Head>
        <title>Next Business · Acceso</title>
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Next Business" className="w-10 h-10 object-contain" />
            <div>
              <div className="text-sm font-semibold text-blue-900">Next Business</div>
              <div className="text-xs text-gray-500">Acceso portal</div>
            </div>
          </div>

          <h1 className="mt-6 text-lg font-semibold text-gray-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-600">
            Introduce la clave de acceso para continuar.
          </p>

          <form onSubmit={onSubmit} className="mt-5 grid gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border rounded-md"
              placeholder="Clave de acceso"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-4 py-3 bg-blue-900 text-white rounded-md font-semibold hover:bg-blue-800 disabled:opacity-60"
            >
              {status === "loading" ? "Entrando..." : "Entrar"}
            </button>
            {error && <div className="text-sm text-red-600">Error: {error}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
