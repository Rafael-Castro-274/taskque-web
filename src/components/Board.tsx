import { useState } from "react";
import { Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Developer, Task, TaskStatus, Project, Sprint } from "../types";
import { COLUMNS } from "../types";
import { TaskCard } from "./TaskCard";
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

export function Board({ tasks, developers, onCreateTask, onUpdateTask, onMoveTask, onDeleteTask, githubConfigured, projects, sprints, selectedSprintId }: Props) {
  const [showCreate, setShowCreate] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const status = result.destination.droppableId as TaskStatus;
    onMoveTask(result.draggableId, status);
  };

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key);
            return (
              <div className="flex w-[280px] min-w-[280px] flex-col rounded-lg border border-border/30 bg-card" key={col.key}>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {col.label}
                    <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">{columnTasks.length}</Badge>
                  </h3>
                  <Button variant="ghost" size="icon-xs" onClick={() => setShowCreate(col.key)}>
                    <Plus size={16} />
                  </Button>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      className={cn(
                        "flex-1 space-y-2 px-2 pb-2 transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5 glow-sm rounded-b-lg"
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging ? { opacity: 0.9, zIndex: 9999 } : {}),
                              }}
                            >
                              <TaskCard
                                task={task}
                                developer={developers.find((d) => d.id === task.assigneeId)}
                                onEdit={() => setEditingTask(task)}
                                onDelete={() => onDeleteTask(task.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
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
          onSave={(data) => {
            onUpdateTask(editingTask.id, data);
          }}
          onClose={() => setEditingTask(null)}
          sprints={sprints}
        />
      )}
    </>
  );
}
