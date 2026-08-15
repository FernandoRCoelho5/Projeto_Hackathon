import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Login } from "./pages/Login";
import { Panel } from "./pages/Panel";
import { EmAndamento } from "./pages/EmAndamento";
import { Registro } from "./pages/Registro";
import { Equipamentos } from "./pages/Equipamentos";
import { Calculator } from "./pages/Calculator";
import { Usuarios } from "./pages/Usuarios";
import { useAuth } from "./lib/auth";

export default function App() {
  const { user, token, login, logout } = useAuth();

  if (!token || !user) {
    return <Login onLogin={login} />;
  }

  const isAdmin = user.role === "administrador";

  return (
    <div className="min-h-dvh bg-base-950">
      <NavBar user={user} onLogout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route path="/painel" element={<Panel user={user} />} />
          <Route path="/em-andamento" element={<EmAndamento user={user} />} />
          <Route path="/registro" element={<Registro user={user} />} />
          <Route path="/equipamentos" element={<Equipamentos user={user} />} />
          {isAdmin && <Route path="/calculadora" element={<Calculator />} />}
          {isAdmin && <Route path="/usuarios" element={<Usuarios />} />}
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </main>
    </div>
  );
}
