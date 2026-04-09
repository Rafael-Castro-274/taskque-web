import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import type { Developer } from "../types";
import { DevModal } from "./DevModal";

interface Props {
  developers: Developer[];
  onCreateDev: (data: Omit<Developer, "id" | "createdAt">) => void;
  onUpdateDev: (id: string, data: Partial<Developer>) => void;
  onDeleteDev: (id: string) => void;
}

export function DevPanel({ developers, onCreateDev, onUpdateDev, onDeleteDev }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <h3><Users size={18} /> Desenvolvedores ({developers.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Adicionar
        </button>
      </div>
      <div className="dev-list">
        {developers.map((dev) => (
          <div className="dev-item" key={dev.id}>
            <span className="avatar" style={{ backgroundColor: dev.color }}>{dev.avatar}</span>
            <span className="dev-name">{dev.name}</span>
            <div className="dev-actions">
              <button className="btn-icon-sm" onClick={() => setEditingDev(dev)}><Pencil size={14} /></button>
              <button className="btn-icon-sm" onClick={() => onDeleteDev(dev.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {developers.length === 0 && (
          <p className="empty-text">Nenhum dev cadastrado</p>
        )}
      </div>

      {showCreate && (
        <DevModal
          onSave={onCreateDev}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editingDev && (
        <DevModal
          developer={editingDev}
          onSave={(data) => onUpdateDev(editingDev.id, data)}
          onClose={() => setEditingDev(null)}
        />
      )}
    </div>
  );
}
