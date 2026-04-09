import { Pencil, Trash2, Calendar } from "lucide-react";
import type { Developer, Task } from "../types";
import { PRIORITIES } from "../types";

interface Props {
  task: Task;
  developer?: Developer;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function TaskCard({ task, developer, onEdit, onDelete }: Props) {
  const priority = PRIORITIES.find((p) => p.key === task.priority);
  const hasDates = task.startDate || task.endDate;

  return (
    <div className="task-card">
      <div className="task-card-header">
        <span className="priority-badge" style={{ backgroundColor: priority?.color }}>
          {priority?.label}
        </span>
        <div className="task-card-actions">
          <button className="btn-icon-sm" onClick={onEdit}><Pencil size={14} /></button>
          <button className="btn-icon-sm" onClick={onDelete}><Trash2 size={14} /></button>
        </div>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-card-footer">
        {hasDates && (
          <div className="task-dates">
            <Calendar size={12} />
            <span>
              {task.startDate ? formatDate(task.startDate) : "—"}
              {" → "}
              {task.endDate ? formatDate(task.endDate) : "—"}
            </span>
          </div>
        )}
        {developer && (
          <div className="task-assignee">
            <span className="avatar-sm" style={{ backgroundColor: developer.color }}>
              {developer.avatar}
            </span>
            <span>{developer.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
