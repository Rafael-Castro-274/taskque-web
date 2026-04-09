import { useState } from "react";
import { X, Mail } from "lucide-react";
import type { User } from "../types";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#ef4444", "#22c55e"];

interface Props {
  developer?: User;
  showAuth?: boolean;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}

export function DevModal({ developer, showAuth, onSave, onClose }: Props) {
  const [name, setName] = useState(developer?.name || "");
  const [email, setEmail] = useState(developer?.email || "");
  const [avatar, setAvatar] = useState(developer?.avatar || "");
  const [color, setColor] = useState(developer?.color || COLORS[0]);
  const [role, setRole] = useState(developer?.role || "member");

  const isCreating = !developer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isCreating && showAuth && !email.trim()) return;

    const data: Record<string, string> = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().slice(0, 2).toUpperCase(),
      color,
      role,
    };

    if (showAuth && isCreating) {
      data.email = email.trim();
    }

    onSave(data);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{developer ? "Editar Usuário" : "Novo Usuário"}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do usuário" autoFocus />
          </div>

          {showAuth && isCreating && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="form-group">
                <label>Papel</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="info-box">
                <Mail size={14} />
                <span>Uma senha temporária será gerada e enviada por email. O usuário deverá alterá-la no primeiro acesso.</span>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Iniciais do Avatar</label>
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Ex: JS" maxLength={2} />
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
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isCreating && showAuth ? "Criar e Enviar Email" : "Salvar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
