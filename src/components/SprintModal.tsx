import { useState } from "react";
import { X } from "lucide-react";
import type { Sprint } from "../types";

interface Props {
  sprint?: Sprint;
  onSave: (data: { name: string; goal: string; startDate: string; endDate: string }) => void;
  onClose: () => void;
}

export function SprintModal({ sprint, onSave, onClose }: Props) {
  const [name, setName] = useState(sprint?.name || "");
  const [goal, setGoal] = useState(sprint?.goal || "");
  const [startDate, setStartDate] = useState(sprint?.startDate || "");
  const [endDate, setEndDate] = useState(sprint?.endDate || "");

  const isEditing = !!sprint;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    onSave({
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Editar Sprint" : "Nova Sprint"}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sprint 1, Sprint Jan/2026..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Objetivo</label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Descreva o objetivo desta sprint..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Data de Término</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEditing ? "Salvar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
