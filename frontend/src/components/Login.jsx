import { useState } from "react";
import { API_URL } from "../utils/api.js";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/employees/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error desconocido");
        return;
      }

      localStorage.setItem("token", data.token);

      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const rol = payload.rol;

      switch (rol) {
        case "mesero":
          window.location.href = "/ordenes";
          break;
        case "cocinero":
          window.location.href = "/cocina";
          break;
        case "gerente":
          window.location.href = "/reportes/gerente";
          break;
        case "financiero":
          window.location.href = "/reportes/financiero";
          break;
        case "admin":
        case "administrador":
          window.location.href = "/admin";
          break;
        default:
          setError("Rol no reconocido");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 font-texto">
      {error && <p className="text-red-300">{error}</p>}

      <input
        type="text"
        placeholder="Usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        className="w-full px-4 py-2 rounded bg-negro text-white placeholder:text-white border border-amarillo"
        required
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 rounded bg-negro text-white placeholder:text-white border border-amarillo"
        required
      />

      <button
        type="submit"
        className="w-full bg-amarillo text-negro font-bold py-2 rounded hover:bg-yellow-500 transition"
      >
        Entrar
      </button>
    </form>
  );
}
