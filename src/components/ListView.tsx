import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Developer, Task, TaskStatus, Project, Sprint } from "../types";
import { COLUMNS, PRIORITIES } from "../types";
import { TaskModal } from "./TaskModal";

interface Props {
  tasks: Task[];
  developers: Developer[];
  onCreateTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[]; subtaskTitles?: string[] }) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  githubConfigured?: boolean;
  projects?: Project[];
  sprints?: Sprint[];
  selectedSprintId?: string | null;
}

function ListRow({
  task,
  priority,
  dev,
  provided,
  snapshot,
  onEdit,
  onDelete,
}: {
  task: Task;
  priority: { label: string; color: string } | undefined;
  dev: Developer | undefined;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const row = (
    <div
      className={cn(
        "group grid grid-cols-[32px_1fr_100px_160px_90px_90px_60px] items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:bg-secondary/20",
        snapshot.isDragging && "border-primary/30 bg-card/90 shadow-lg glow-sm"
      )}
      ref={provided.innerRef}
      {...provided.draggableProps}
    >
      <div className="flex items-center justify-center text-muted-foreground cursor-grab" {...provided.dragHandleProps}>
        <GripVertical size={14} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{task.title}</div>
        {task.description && (
          <div className="truncate text-xs text-muted-foreground">{task.description}</div>
        )}
      </div>
      <div>
        <Badge
          className="text-[0.6rem] font-semibold uppercase border-0"
          style={{ backgroundColor: priority?.color, color: "#fff" }}
        >
          {priority?.label}
        </Badge>
      </div>
      <div>
        {dev ? (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[0.6rem] font-bold text-white shrink-0"
              style={{ backgroundColor: dev.color }}
            >
              {dev.avatar}
            </span>
            <span className="truncate text-xs">{dev.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {task.startDate ? new Date(task.startDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
      </div>
      <div className="text-xs text-muted-foreground">
        {task.endDate ? new Date(task.endDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
      </div>
      <div>
        <div className={cn("flex gap-0.5", snapshot.isDragging ? "opacity-0" : "opacity-0 group-hover:opacity-100 transition-opacity")}>
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  if (snapshot.isDragging) {
    return createPortal(row, document.body);
  }

  return row;
}

export function ListView({ tasks, developers, onCreateTask, onUpdateTask, onMoveTask, onDeleteTask, githubConfigured, projects, sprints, selectedSprintId }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const toggle = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const getPriority = (key: string) => PRIORITIES.find((p) => p.key === key);
  const getDev = (id: string | null) => developers.find((d) => d.id === id);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const status = result.destination.droppableId as TaskStatus;
    onMoveTask(result.draggableId, status);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col gap-3 p-1">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key);
            const isCollapsed = collapsed[col.key];

            return (
              <div className="rounded-lg border border-border/30 bg-card/50" key={col.key}>
                <div
                  className="flex cursor-pointer items-center justify-between px-3 py-2.5 transition-colors hover:bg-secondary/10"
                  onClick={() => toggle(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {isCollapsed ? <ChevronRight size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">{columnTasks.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreate(col.key);
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {!isCollapsed && (
                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <div
                        className={cn(
                          "px-1 pb-1 transition-colors",
                          snapshot.isDraggingOver && "bg-primary/5"
                        )}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {columnTasks.length > 0 && (
                          <div className="grid grid-cols-[32px_1fr_100px_160px_90px_90px_60px] gap-1 px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                            <div></div>
                            <div>Título</div>
                            <div>Prioridade</div>
                            <div>Responsável</div>
                            <div>Início</div>
                            <div>Fim</div>
                            <div></div>
                          </div>
                        )}
                        {columnTasks.map((task, index) => {
                          const priority = getPriority(task.priority);
                          const dev = getDev(task.assigneeId);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <ListRow
                                  task={task}
                                  priority={priority}
                                  dev={dev}
                                  provided={provided}
                                  snapshot={snapshot}
                                  onEdit={() => setEditingTask(task)}
                                  onDelete={() => onDeleteTask(task.id)}
                                />
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        {columnTasks.length === 0 && (
                          <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma tarefa</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {showCreate && (
        <TaskModal
          developers={developers}
          projects={projects}
          defaultStatus={showCreate}
          githubConfigured={githubConfigured}
          onSave={onCreateTask}
          onClose={() => setShowCreate(null)}
          sprints={sprints}
          selectedSprintId={selectedSprintId}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          developers={developers}
          onSave={(data) => onUpdateTask(editingTask.id, data)}
          onClose={() => setEditingTask(null)}
          sprints={sprints}
        />
      )}
    </>
  );
}
