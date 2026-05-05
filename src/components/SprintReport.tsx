import { useState, useMemo } from "react";
import { BarChart3, Calendar, CheckCircle2, Clock, ChevronDown, ChevronRight, Target, Users, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Sprint, Task, Developer } from "../types";
import { COLUMNS, PRIORITIES } from "../types";

interface Props {
  sprints: Sprint[];
  tasks: Task[];
  developers: Developer[];
}

const statusColors: Record<string, string> = {
  backlog: "#64748b",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  review: "#a855f7",
  done: "#22c55e",
};

function getSprintDays(sprint: Sprint) {
  const start = new Date(sprint.startDate + "T00:00:00");
  const end = new Date(sprint.endDate + "T00:00:00");
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function SprintDetail({ sprint, sprintTasks, developers }: { sprint: Sprint; sprintTasks: Task[]; developers: Developer[] }) {
  const total = sprintTasks.length;
  const done = sprintTasks.filter((t) => t.status === "done").length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  const days = getSprintDays(sprint);

  const byStatus = COLUMNS.map((col) => ({
    ...col,
    count: sprintTasks.filter((t) => t.status === col.key).length,
  }));

  const byPriority = PRIORITIES.map((p) => ({
    ...p,
    count: sprintTasks.filter((t) => t.priority === p.key).length,
  }));

  const byDev = developers
    .map((dev) => {
      const devTasks = sprintTasks.filter((t) => t.assigneeId === dev.id);
      const devDone = devTasks.filter((t) => t.status === "done").length;
      return { dev, total: devTasks.length, done: devDone };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  const unassigned = sprintTasks.filter((t) => !t.assigneeId).length;

  const totalSubtasks = sprintTasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
  const doneSubtasks = sprintTasks.reduce((sum, t) => sum + (t.subtasks?.filter((s) => s.done).length || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sprint Info */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Calendar size={14} /> Informações
          </div>
          {sprint.goal && <p className="text-xs text-muted-foreground">{sprint.goal}</p>}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período</span>
              <span>{formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duração</span>
              <span>{days} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conclusão</span>
              <span className="font-semibold text-primary">{rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarefas</span>
              <span>{done}/{total}</span>
            </div>
            {totalSubtasks > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtarefas</span>
                <span>{doneSubtasks}/{totalSubtasks}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <BarChart3 size={14} /> Por Status
          </div>
          <div className="space-y-2">
            {byStatus.map((s) => (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary/50">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: total > 0 ? `${(s.count / total) * 100}%` : "0%",
                      backgroundColor: statusColors[s.key],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Target size={14} /> Por Prioridade
          </div>
          <div className="space-y-2">
            {byPriority.map((p) => (
              <div key={p.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.label}</span>
                  </div>
                  <span className="font-medium">{p.count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary/50">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: total > 0 ? `${(p.count / total) * 100}%` : "0%",
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dev Workload */}
      {byDev.length > 0 && (
        <Card className="border-border/30 bg-card/50 md:col-span-2 lg:col-span-3">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Users size={14} /> Workload por Responsável
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byDev.map(({ dev, total: dt, done: dd }) => (
                <div key={dev.id} className="flex items-center gap-3 rounded-md border border-border/20 bg-secondary/20 p-2.5">
                  <span
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: dev.color }}
                  >
                    {dev.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{dev.name}</span>
                      <span className="text-muted-foreground">{dd}/{dt}</span>
                    </div>
                    <Progress value={dt > 0 ? (dd / dt) * 100 : 0} className="mt-1 h-1.5" />
                  </div>
                </div>
              ))}
              {unassigned > 0 && (
                <div className="flex items-center gap-3 rounded-md border border-border/20 bg-secondary/20 p-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">?</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">Sem responsável</span>
                      <span className="text-muted-foreground">{unassigned}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SprintReport({ sprints, tasks, developers }: Props) {
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);

  const sortedSprints = useMemo(() => {
    const order = { active: 0, completed: 1, planning: 2 };
    return [...sprints].sort((a, b) => order[a.status] - order[b.status]);
  }, [sprints]);

  const getSprintTasks = (sprintId: string) => tasks.filter((t) => t.sprintId === sprintId);

  // Macro stats
  const activeSprint = sprints.find((s) => s.status === "active");
  const allSprintTasks = tasks.filter((t) => t.sprintId);
  const allDoneTasks = allSprintTasks.filter((t) => t.status === "done");
  const avgRate = allSprintTasks.length > 0 ? Math.round((allDoneTasks.length / allSprintTasks.length) * 100) : 0;

  // Data for comparison chart
  const chartData = useMemo(() => {
    return sortedSprints
      .filter((s) => s.status !== "planning")
      .map((s) => {
        const st = getSprintTasks(s.id);
        const done = st.filter((t) => t.status === "done").length;
        const total = st.length;
        return { sprint: s, done, total, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
      });
  }, [sortedSprints, tasks]);

  const maxTasks = Math.max(...chartData.map((d) => d.total), 1);

  const sprintStatusColors: Record<string, string> = {
    planning: "#3b82f6",
    active: "#22c55e",
    completed: "#64748b",
  };
  const sprintStatusLabels: Record<string, string> = {
    planning: "Planejamento",
    active: "Ativa",
    completed: "Concluída",
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-xl font-bold text-primary glow-text">
          <BarChart3 size={24} />
          Relatório de Sprints
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Visão geral de desempenho de todas as sprints</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border/30 bg-card/60">
          <CardContent className="flex flex-col items-center px-4 py-3">
            <Zap size={18} className="mb-1 text-primary" />
            <span className="text-2xl font-bold">{sprints.length}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Sprints</span>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/60">
          <CardContent className="flex flex-col items-center px-4 py-3">
            <CheckCircle2 size={18} className="mb-1 text-success" />
            <span className="text-2xl font-bold">{allDoneTasks.length}<span className="text-sm font-normal text-muted-foreground">/{allSprintTasks.length}</span></span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Tasks Concluídas</span>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/60">
          <CardContent className="flex flex-col items-center px-4 py-3">
            <TrendingUp size={18} className="mb-1 text-primary" />
            <span className="text-2xl font-bold">{avgRate}<span className="text-sm font-normal text-muted-foreground">%</span></span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Taxa Média</span>
          </CardContent>
        </Card>
        <Card className="border-border/30 bg-card/60">
          <CardContent className="flex flex-col items-center px-4 py-3">
            <Clock size={18} className="mb-1 text-warning" />
            <span className="text-2xl font-bold">{activeSprint ? "1" : "0"}</span>
            <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">Sprint Ativa</span>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      {chartData.length > 0 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 size={16} className="text-primary" /> Comparativo entre Sprints
            </h2>
            <div className="space-y-3">
              {chartData.map(({ sprint, done, total, rate }) => (
                <div key={sprint.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sprint.name}</span>
                      <Badge
                        className="text-[0.5rem] px-1 py-0 border-0"
                        style={{ backgroundColor: sprintStatusColors[sprint.status], color: "#fff" }}
                      >
                        {sprintStatusLabels[sprint.status]}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">{done}/{total} ({rate}%)</span>
                  </div>
                  <div className="relative h-6 w-full rounded bg-secondary/30 overflow-hidden">
                    {/* Total bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-border/40"
                      style={{ width: `${(total / maxTasks) * 100}%` }}
                    />
                    {/* Done bar */}
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-primary/60 transition-all duration-700"
                      style={{ width: `${(done / maxTasks) * 100}%` }}
                    />
                    {/* Rate label */}
                    <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-bold text-foreground">
                      {rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[0.6rem] text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded bg-primary/60" /> Concluídas
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded bg-border/40" /> Total
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution Chart (line via SVG) */}
      {chartData.length >= 2 && (
        <Card className="border-border/30 bg-card/50">
          <CardContent className="p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp size={16} className="text-primary" /> Evolução da Taxa de Conclusão
            </h2>
            <div className="relative h-[160px] w-full">
              <svg viewBox={`0 0 ${chartData.length * 100} 160`} className="h-full w-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((v) => (
                  <line
                    key={v}
                    x1="0" y1={160 - (v / 100) * 140 - 10}
                    x2={chartData.length * 100} y2={160 - (v / 100) * 140 - 10}
                    stroke="oklch(0.3 0.05 240)" strokeWidth="0.5" strokeDasharray="4 4"
                  />
                ))}
                {/* Line */}
                <polyline
                  fill="none"
                  stroke="oklch(0.75 0.18 195)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={chartData.map((d, i) => `${i * 100 + 50},${160 - (d.rate / 100) * 140 - 10}`).join(" ")}
                />
                {/* Area fill */}
                <polygon
                  fill="oklch(0.75 0.18 195 / 0.1)"
                  points={`${50},${150} ${chartData.map((d, i) => `${i * 100 + 50},${160 - (d.rate / 100) * 140 - 10}`).join(" ")} ${(chartData.length - 1) * 100 + 50},${150}`}
                />
                {/* Dots + labels */}
                {chartData.map((d, i) => {
                  const cx = i * 100 + 50;
                  const cy = 160 - (d.rate / 100) * 140 - 10;
                  return (
                    <g key={d.sprint.id}>
                      <circle cx={cx} cy={cy} r="4" fill="oklch(0.75 0.18 195)" />
                      <circle cx={cx} cy={cy} r="6" fill="none" stroke="oklch(0.75 0.18 195 / 0.3)" strokeWidth="2" />
                      <text x={cx} y={cy - 12} textAnchor="middle" fill="oklch(0.95 0.02 220)" fontSize="11" fontWeight="600">
                        {d.rate}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex" style={{ paddingLeft: 0 }}>
                {chartData.map((d) => (
                  <div key={d.sprint.id} className="flex-1 text-center text-[0.55rem] text-muted-foreground truncate px-1">
                    {d.sprint.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sprint Details */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Detalhes por Sprint</h2>
        {sortedSprints.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma sprint encontrada</p>
        ) : (
          sortedSprints.map((sprint) => {
            const sprintTasks = getSprintTasks(sprint.id);
            const done = sprintTasks.filter((t) => t.status === "done").length;
            const total = sprintTasks.length;
            const rate = total > 0 ? Math.round((done / total) * 100) : 0;
            const isExpanded = expandedSprint === sprint.id;

            return (
              <Card key={sprint.id} className={cn("border-border/30 bg-card/50 transition-[border-color] duration-200", isExpanded && "border-primary/30")}>
                <div
                  className="flex cursor-pointer items-center gap-3 p-4 hover:bg-secondary/10 transition-colors"
                  onClick={() => setExpandedSprint(isExpanded ? null : sprint.id)}
                >
                  {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{sprint.name}</span>
                      <Badge
                        className="text-[0.5rem] px-1 py-0 border-0"
                        style={{ backgroundColor: sprintStatusColors[sprint.status], color: "#fff" }}
                      >
                        {sprintStatusLabels[sprint.status]}
                      </Badge>
                    </div>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)} · {total} tarefas
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <Progress value={rate} className="h-2" />
                    </div>
                    <span className="text-sm font-bold text-primary w-12 text-right">{rate}%</span>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border/20 p-4">
                    {total === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma tarefa nesta sprint</p>
                    ) : (
                      <SprintDetail sprint={sprint} sprintTasks={sprintTasks} developers={developers} />
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
