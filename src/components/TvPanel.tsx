import { useEffect, useState } from "react";
import { Clock, Calendar, Activity, User, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    <Card className="border-border/30 bg-card/40 backdrop-blur-sm">
      <CardContent className="flex flex-col items-end gap-0.5 p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={16} />
        </div>
        <span className="text-2xl font-bold tabular-nums text-foreground glow-text">
          {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </span>
      </CardContent>
    </Card>
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
    <div className="flex flex-col gap-6 p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-primary glow-text">
            <Activity size={28} />
            Painel de Atividades
          </h1>
          <div className="flex gap-3">
            {[
              { value: inProgress.length, label: "Em progresso" },
              { value: inReview.length, label: "Em revisão" },
              { value: doneTasks.length, label: "Concluídas" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/30 bg-card/40 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center px-5 py-2.5">
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <TimeDisplay />
      </div>

      {/* Body */}
      {totalActive === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Activity size={48} className="opacity-30" />
          <h2 className="text-lg font-semibold">Nenhuma tarefa em andamento</h2>
          <p className="text-sm">As tarefas em progresso e revisão aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-6">
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-warning animate-glow-pulse" />
                Em Progresso
              </h2>
              <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
                {inProgress.map((task) => {
                  const dev = getDev(task.assigneeId);
                  const priority = getPriority(task.priority);
                  const daysLeft = getDaysRemaining(task.endDate);
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  const isUrgent = daysLeft !== null && daysLeft <= 1 && daysLeft >= 0;

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        "border-border/30 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:glow-md",
                        isOverdue && "border-destructive/40",
                        isUrgent && "border-warning/40"
                      )}
                    >
                      <CardContent className="flex flex-col gap-3 p-4">
                        <div className="flex items-center gap-2">
                          <Badge className="border-0 text-[0.6rem] font-semibold uppercase" style={{ backgroundColor: priority?.color, color: "#fff" }}>
                            {priority?.label}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="gap-1 text-[0.6rem]">
                              <AlertTriangle size={10} /> Atrasada
                            </Badge>
                          )}
                          {isUrgent && !isOverdue && (
                            <Badge className="gap-1 border-0 bg-warning/20 text-warning text-[0.6rem]">
                              <Clock size={10} /> Vence {daysLeft === 0 ? "hoje" : "amanhã"}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-semibold leading-tight">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{task.description}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-1">
                          {dev ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                                style={{ backgroundColor: dev.color }}
                              >
                                {dev.avatar}
                              </span>
                              <span className="text-xs text-muted-foreground">{dev.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                              <User size={14} />
                              <span>Não atribuída</span>
                            </div>
                          )}
                          {(task.startDate || task.endDate) && (
                            <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                              <Calendar size={12} />
                              <span>
                                {task.startDate ? formatDate(task.startDate) : "—"}
                                {" → "}
                                {task.endDate ? formatDate(task.endDate) : "—"}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {inReview.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Em Revisão
              </h2>
              <div className="grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
                {inReview.map((task) => {
                  const dev = getDev(task.assigneeId);
                  const priority = getPriority(task.priority);

                  return (
                    <Card
                      key={task.id}
                      className="border-border/30 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:glow-md"
                    >
                      <CardContent className="flex flex-col gap-3 p-4">
                        <Badge className="w-fit border-0 text-[0.6rem] font-semibold uppercase" style={{ backgroundColor: priority?.color, color: "#fff" }}>
                          {priority?.label}
                        </Badge>
                        <h3 className="text-base font-semibold leading-tight">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{task.description}</p>
                        )}
                        <div className="mt-auto flex items-center pt-1">
                          {dev ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                                style={{ backgroundColor: dev.color }}
                              >
                                {dev.avatar}
                              </span>
                              <span className="text-xs text-muted-foreground">{dev.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                              <User size={14} />
                              <span>Não atribuída</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
