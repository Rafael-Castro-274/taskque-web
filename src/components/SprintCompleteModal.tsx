import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Completar Sprint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
            <h3 className="text-sm font-semibold">{sprint.name}</h3>
            {sprint.goal && <p className="mt-1 text-xs text-muted-foreground">{sprint.goal}</p>}
            <div className="mt-3 flex gap-3">
              <Badge variant="outline" className="gap-1 border-success/30 text-success">
                <CheckCircle2 size={12} /> {doneTasks.length} concluída{doneTasks.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="border-warning/30 text-warning">
                {incompleteTasks.length} pendente{incompleteTasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {incompleteTasks.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Todas as tarefas foram concluídas! A sprint pode ser finalizada.
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground">Escolha o destino das tarefas pendentes:</p>
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {incompleteTasks.map((task) => {
                  const statusInfo = COLUMNS.find((c) => c.key === task.status);
                  const priorityInfo = PRIORITIES.find((p) => p.key === task.priority);
                  return (
                    <div key={task.id} className="flex items-center gap-3 rounded-md border border-border/30 bg-secondary/10 p-2.5">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{task.title}</span>
                        <div className="mt-1 flex items-center gap-2 text-[0.65rem] text-muted-foreground">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusColors[task.status] }} />
                          <span>{statusInfo?.label}</span>
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: priorityInfo?.color }} />
                          <span>{priorityInfo?.label}</span>
                        </div>
                      </div>
                      <select
                        className="h-8 rounded-md border border-input bg-secondary/30 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleComplete}>Completar Sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
