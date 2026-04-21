import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { Sprint, Task } from "../types";
import { COLUMNS, PRIORITIES } from "../types";

interface Props {
  sprint: Sprint;
  tasks: Task[];
  planningSprints: Sprint[];
  onComplete: (moves: { taskId: string; target: string | null }[]) => void;
  onClose: () => void;
}

export function SprintCompleteModal({ sprint, tasks, planningSprints, onComplete, onClose }: Props) {
  const incompleteTasks = tasks.filter((t) => t.sprintId === sprint.id && t.status !== "done");
  const doneTasks = tasks.filter((t) => t.sprintId === sprint.id && t.status === "done");
  const defaultTarget = planningSprints.length > 0 ? planningSprints[0].id : null;

  const [moves, setMoves] = useState<Record<string, string | null>>(
    () => Object.fromEntries(incompleteTasks.map((t) => [t.id, defaultTarget]))
  );

  const handleComplete = () => {
    const moveArray = incompleteTasks.map((t) => ({
      taskId: t.id,
      target: moves[t.id] ?? null,
    }));
    onComplete(moveArray);
    onClose();
  };

  const statusColors: Record<string, string> = {
    backlog: "#64748b",
    todo: "#3b82f6",
    in_progress: "#f59e0b",
    review: "#a855f7",
    done: "#22c55e",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sprint-complete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Completar Sprint</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="sprint-complete-summary">
          <h3>{sprint.name}</h3>
          {sprint.goal && <p className="sprint-complete-goal">{sprint.goal}</p>}
          <div className="sprint-complete-stats">
            <span className="sprint-stat sprint-stat-done">
              <CheckCircle2 size={14} /> {doneTasks.length} concluída{doneTasks.length !== 1 ? "s" : ""}
            </span>
            <span className="sprint-stat sprint-stat-pending">
              {incompleteTasks.length} pendente{incompleteTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {incompleteTasks.length === 0 ? (
          <div className="sprint-complete-empty">
            <p>Todas as tarefas foram concluídas! A sprint pode ser finalizada.</p>
          </div>
        ) : (
          <>
            <p className="sprint-complete-label">Escolha o destino das tarefas pendentes:</p>
            <div className="sprint-complete-tasks">
              {incompleteTasks.map((task) => {
                const statusInfo = COLUMNS.find((c) => c.key === task.status);
                const priorityInfo = PRIORITIES.find((p) => p.key === task.priority);
                return (
                  <div key={task.id} className="sprint-complete-task-row">
                    <div className="sprint-complete-task-info">
                      <span className="sprint-complete-task-title">{task.title}</span>
                      <div className="sprint-complete-task-meta">
                        <span className="chip-dot" style={{ background: statusColors[task.status] }} />
                        <span>{statusInfo?.label}</span>
                        <span className="chip-dot" style={{ background: priorityInfo?.color }} />
                        <span>{priorityInfo?.label}</span>
                      </div>
                    </div>
                    <select
                      className="sprint-complete-select"
                      value={moves[task.id] ?? ""}
                      onChange={(e) => setMoves((prev) => ({ ...prev, [task.id]: e.target.value || null }))}
                    >
                      <option value="">Backlog</option>
                      {planningSprints.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleComplete}>
            Completar Sprint
          </button>
        </div>
      </div>
    </div>
  );
}
