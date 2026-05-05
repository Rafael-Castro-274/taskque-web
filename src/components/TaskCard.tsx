import { Pencil, Trash2, Calendar, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
  const subtasks = task.subtasks || [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const hasSubtasks = subtasks.length > 0;

  return (
    <Card className="group h-[200px] border-border/50 bg-card/60 transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:glow-sm">
      <CardContent className="flex h-full flex-col gap-2 p-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge
            className="text-[0.65rem] font-semibold uppercase tracking-wider border-0"
            style={{ backgroundColor: priority?.color, color: "#fff" }}
          >
            {priority?.label}
          </Badge>
          <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon-xs" onClick={onEdit}>
              <Pencil size={14} />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onDelete}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{task.title}</h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        {/* Subtasks */}
        {hasSubtasks && (
          <div className="flex flex-col gap-1">
            <Progress value={(doneCount / subtasks.length) * 100} className="h-1.5" />
            <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
              <CheckSquare size={12} />
              <span>{doneCount}/{subtasks.length}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2">
          {hasDates && (
            <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
              <Calendar size={12} />
              <span>
                {task.startDate ? formatDate(task.startDate) : "—"}
                {" → "}
                {task.endDate ? formatDate(task.endDate) : "—"}
              </span>
            </div>
          )}
          {developer && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[0.65rem] font-bold text-white shrink-0"
                style={{ backgroundColor: developer.color }}
              >
                {developer.avatar}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">{developer.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
