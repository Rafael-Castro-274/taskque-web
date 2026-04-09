import { useState } from "react";
import { Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import type { Developer, Task, TaskStatus } from "../types";
import { COLUMNS } from "../types";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";

interface Props {
  tasks: Task[];
  developers: Developer[];
  onCreateTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
}

export function Board({ tasks, developers, onCreateTask, onUpdateTask, onMoveTask, onDeleteTask }: Props) {
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
        <div className="board">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key);
            return (
              <div className="column" key={col.key}>
                <div className="column-header">
                  <h3>{col.label} <span className="count">{columnTasks.length}</span></h3>
                  <button className="btn-icon" onClick={() => setShowCreate(col.key)}>
                    <Plus size={18} />
                  </button>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      className={`column-body ${snapshot.isDraggingOver ? "drag-over" : ""}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
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
          defaultStatus={showCreate}
          onSave={onCreateTask}
          onClose={() => setShowCreate(null)}
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
        />
      )}
    </>
  );
}
