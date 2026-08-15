import { Navigate, Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Login } from "./pages/Login";
import { Report } from "./pages/Report";
import { Panel } from "./pages/Panel";
import { EmAndamento } from "./pages/EmAndamento";
import { Registro } from "./pages/Registro";
import { Calculator } from "./pages/Calculator";
import { useAuth } from "./lib/auth";

export default function App() {
  const { user, token, login, logout } = useAuth();

  if (!token || !user) {
    return <Login onLogin={login} />;
  }

  const canReport = user.role === "funcionario" || user.role === "team-leader";
  const canSeeEmAndamento = user.role === "manutencao" || user.role === "team-leader";
  const canSeeCalculadora = user.role === "team-leader";

  return (
    <div className="min-h-dvh bg-base-950">
      <NavBar user={user} onLogout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/painel" replace />} />
          <Route path="/painel" element={<Panel user={user} />} />
          {canReport && <Route path="/reportar" element={<Report />} />}
          {canSeeEmAndamento && (
            <Route path="/em-andamento" element={<EmAndamento user={user} />} />
          )}
          <Route path="/registro" element={<Registro user={user} />} />
          {canSeeCalculadora && <Route path="/calculadora" element={<Calculator />} />}
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Routes>
      </main>
    </div>
  );
}
