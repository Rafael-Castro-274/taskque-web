import { useState } from "react";
import { X } from "lucide-react";
import type { Developer, Task, TaskStatus } from "../types";
import { PRIORITIES } from "../types";
import { Comments } from "./Comments";

interface Props {
  task?: Task;
  developers: Developer[];
  defaultStatus?: TaskStatus;
  onSave: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}

export function TaskModal({ task, developers, defaultStatus = "backlog", onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [startDate, setStartDate] = useState(task?.startDate || "");
  const [endDate, setEndDate] = useState(task?.endDate || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId: assigneeId || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${task ? "modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task ? "Editar Tarefa" : "Nova Tarefa"}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className={task ? "modal-split" : ""}>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da tarefa" autoFocus />
            </div>
            <div className="form-group">
              <label>Descrição</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição da tarefa" rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                  <option value="backlog">Backlog</option>
                  <option value="todo">A Fazer</option>
                  <option value="in_progress">Em Progresso</option>
                  <option value="review">Revisão</option>
                  <option value="done">Concluído</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prioridade</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}>
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Responsável</label>
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Sem responsável</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Data de Início</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data de Fim</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar</button>
            </div>
          </form>

          {task && (
            <div className="modal-comments">
              <Comments taskId={task.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
