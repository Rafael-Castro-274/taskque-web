import { useEffect, useState } from "react";
import { Clock, Calendar, Activity, User, AlertTriangle } from "lucide-react";
import type { Developer, Task } from "../types";
import { PRIORITIES } from "../types";

interface Props {
  tasks: Task[];
  developers: Developer[];
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function TimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tv-clock">
      <Clock size={18} />
      <span className="tv-time">
        {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="tv-date-text">
        {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </span>
    </div>
  );
}

function getDaysRemaining(endDate: string | null) {
  if (!endDate) return null;
  const end = new Date(endDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function TvPanel({ tasks, developers }: Props) {
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const inReview = tasks.filter((t) => t.status === "review");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const totalActive = inProgress.length + inReview.length;

  const getDev = (id: string | null) => developers.find((d) => d.id === id);
  const getPriority = (key: string) => PRIORITIES.find((p) => p.key === key);

  return (
    <div className="tv-panel">
      <div className="tv-header">
        <div className="tv-header-left">
          <h1 className="tv-title">
            <Activity size={28} />
            Painel de Atividades
          </h1>
          <div className="tv-stats">
            <div className="tv-stat">
              <span className="tv-stat-value">{inProgress.length}</span>
              <span className="tv-stat-label">Em progresso</span>
            </div>
            <div className="tv-stat">
              <span className="tv-stat-value">{inReview.length}</span>
              <span className="tv-stat-label">Em revisão</span>
            </div>
            <div className="tv-stat">
              <span className="tv-stat-value">{doneTasks.length}</span>
              <span className="tv-stat-label">Concluídas</span>
            </div>
          </div>
        </div>
        <TimeDisplay />
      </div>

      <div className="tv-body">
        {totalActive === 0 ? (
          <div className="tv-empty">
            <Activity size={48} />
            <h2>Nenhuma tarefa em andamento</h2>
            <p>As tarefas em progresso e revisão aparecerão aqui</p>
          </div>
        ) : (
          <>
            {inProgress.length > 0 && (
              <div className="tv-section">
                <h2 className="tv-section-title">
                  <span className="tv-section-dot tv-dot-progress" />
                  Em Progresso
                </h2>
                <div className="tv-grid">
                  {inProgress.map((task) => {
                    const dev = getDev(task.assigneeId);
                    const priority = getPriority(task.priority);
                    const daysLeft = getDaysRemaining(task.endDate);
                    const isOverdue = daysLeft !== null && daysLeft < 0;
                    const isUrgent = daysLeft !== null && daysLeft <= 1 && daysLeft >= 0;

                    return (
                      <div
                        key={task.id}
                        className={`tv-card ${isOverdue ? "tv-card-overdue" : ""} ${isUrgent ? "tv-card-urgent" : ""}`}
                      >
                        <div className="tv-card-top">
                          <span className="priority-badge" style={{ backgroundColor: priority?.color }}>
                            {priority?.label}
                          </span>
                          {isOverdue && (
                            <span className="tv-overdue-badge">
                              <AlertTriangle size={12} /> Atrasada
                            </span>
                          )}
                          {isUrgent && !isOverdue && (
                            <span className="tv-urgent-badge">
                              <Clock size={12} /> Vence {daysLeft === 0 ? "hoje" : "amanhã"}
                            </span>
                          )}
                        </div>
                        <h3 className="tv-card-title">{task.title}</h3>
                        {task.description && (
                          <p className="tv-card-desc">{task.description}</p>
                        )}
                        <div className="tv-card-footer">
                          {dev ? (
                            <div className="tv-card-dev">
                              <span className="tv-avatar" style={{ backgroundColor: dev.color }}>
                                {dev.avatar}
                              </span>
                              <span>{dev.name}</span>
                            </div>
                          ) : (
                            <div className="tv-card-dev tv-unassigned">
                              <User size={14} />
                              <span>Não atribuída</span>
                            </div>
                          )}
                          {(task.startDate || task.endDate) && (
                            <div className="tv-card-dates">
                              <Calendar size={13} />
                              <span>
                                {task.startDate ? formatDate(task.startDate) : "—"}
                                {" → "}
                                {task.endDate ? formatDate(task.endDate) : "—"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {inReview.length > 0 && (
              <div className="tv-section">
                <h2 className="tv-section-title">
                  <span className="tv-section-dot tv-dot-review" />
                  Em Revisão
                </h2>
                <div className="tv-grid">
                  {inReview.map((task) => {
                    const dev = getDev(task.assigneeId);
                    const priority = getPriority(task.priority);

                    return (
                      <div key={task.id} className="tv-card tv-card-review">
                        <div className="tv-card-top">
                          <span className="priority-badge" style={{ backgroundColor: priority?.color }}>
                            {priority?.label}
                          </span>
                        </div>
                        <h3 className="tv-card-title">{task.title}</h3>
                        {task.description && (
                          <p className="tv-card-desc">{task.description}</p>
                        )}
                        <div className="tv-card-footer">
                          {dev ? (
                            <div className="tv-card-dev">
                              <span className="tv-avatar" style={{ backgroundColor: dev.color }}>
                                {dev.avatar}
                              </span>
                              <span>{dev.name}</span>
                            </div>
                          ) : (
                            <div className="tv-card-dev tv-unassigned">
                              <User size={14} />
                              <span>Não atribuída</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
