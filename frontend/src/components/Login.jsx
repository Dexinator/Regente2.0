import { useState } from "react";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error desconocido");
        return;
      }

      // Guardar token
      localStorage.setItem("token", data.token);

      // Decodificar el token para extraer el rol
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const rol = payload.rol;

      // Redirigir según el rol
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
    } catch (err) {
      setError("Error de conexión");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="bg-neutral-800 p-6 rounded-xl shadow-lg w-full max-w-sm space-y-4"
    >
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      {error && <p className="text-red-400">{error}</p>}

      <input
        type="text"
        placeholder="Usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        className="w-full px-4 py-2 rounded bg-neutral-700 text-white"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 rounded bg-neutral-700 text-white"
        required
      />
      <button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded font-bold"
      >
        Entrar
      </button>
    </form>
  );
}
