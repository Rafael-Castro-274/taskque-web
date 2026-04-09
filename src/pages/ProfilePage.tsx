import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#ef4444", "#22c55e"];

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [color, setColor] = useState(user?.color || COLORS[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password && password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password && password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      return;
    }

    setSaving(true);
    const data: Record<string, string> = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().slice(0, 2).toUpperCase(),
      color,
    };
    if (password) data.password = password;

    const result = await updateProfile(data);
    setSaving(false);

    if (result) {
      setSaved(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError("Erro ao salvar perfil");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <button className="btn-icon" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
          </button>
          <h2>Meu Perfil</h2>
        </div>

        <div className="profile-avatar-section">
          <span className="profile-avatar-lg" style={{ backgroundColor: color }}>
            {avatar || name.slice(0, 2).toUpperCase()}
          </span>
          <div className="profile-info">
            <h3>{user.name}</h3>
            <span className="profile-email">{user.email}</span>
            <span className={`profile-role ${user.role}`}>
              {user.role === "admin" ? "Administrador" : "Membro"}
            </span>
          </div>
        </div>

        {error && <div className="login-error"><span>{error}</span></div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Iniciais do Avatar</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} maxLength={2} />
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="profile-divider" />

          <h3 className="profile-section-title">Alterar Senha</h3>
          <div className="form-group">
            <label>Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe vazio para manter"
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

          <button type="submit" className="btn btn-primary login-btn" disabled={saving}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}
