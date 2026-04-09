import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateProfile, user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Digite a nova senha");
      return;
    }
    if (password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const result = await updateProfile({ password });
    setLoading(false);

    if (result) {
      setUser({ ...result, mustChangePassword: false });
      navigate("/");
    } else {
      setError("Erro ao alterar senha. Tente novamente.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="TaskQue" className="login-logo-img" />
          <p className="login-subtitle">
            Olá {user?.name}, defina sua nova senha para continuar
          </p>
        </div>

        <div className="info-box" style={{ marginBottom: 20 }}>
          <Lock size={14} />
          <span>Esta é uma senha temporária. Você precisa criar uma nova senha antes de continuar.</span>
        </div>

        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua nova senha"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            <Lock size={16} />
            {loading ? "Salvando..." : "Definir Nova Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
