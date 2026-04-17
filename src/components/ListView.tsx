import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import type { Developer, Task, TaskStatus, Project } from "../types";
import { COLUMNS, PRIORITIES } from "../types";
import { TaskModal } from "./TaskModal";

interface Props {
  tasks: Task[];
  developers: Developer[];
  onCreateTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[] }) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onMoveTask: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  githubConfigured?: boolean;
  projects?: Project[];
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
      className={`list-row list-data-row ${snapshot.isDragging ? "list-row-dragging" : ""}`}
      ref={provided.innerRef}
      {...provided.draggableProps}
    >
      <div className="list-cell list-cell-grip" {...provided.dragHandleProps}>
        <GripVertical size={14} />
      </div>
      <div className="list-cell list-cell-title">
        <div className="list-task-title">{task.title}</div>
        {task.description && (
          <div className="list-task-desc">{task.description}</div>
        )}
      </div>
      <div className="list-cell list-cell-priority">
        <span className="priority-badge" style={{ backgroundColor: priority?.color }}>
          {priority?.label}
        </span>
      </div>
      <div className="list-cell list-cell-assignee">
        {dev ? (
          <div className="list-assignee">
            <span className="avatar-sm" style={{ backgroundColor: dev.color }}>
              {dev.avatar}
            </span>
            <span>{dev.name}</span>
          </div>
        ) : (
          <span className="text-muted">—</span>
        )}
      </div>
      <div className="list-cell list-cell-date text-muted">
        {task.startDate ? new Date(task.startDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
      </div>
      <div className="list-cell list-cell-date text-muted">
        {task.endDate ? new Date(task.endDate + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
      </div>
      <div className="list-cell list-cell-actions">
        <div className="list-actions" style={snapshot.isDragging ? { opacity: 0 } : undefined}>
          <button className="btn-icon-sm" onClick={onEdit}>
            <Pencil size={14} />
          </button>
          <button className="btn-icon-sm" onClick={onDelete}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  if (snapshot.isDragging) {
    return createPortal(row, document.body);
  }

  return row;
}

export function ListView({ tasks, developers, onCreateTask, onUpdateTask, onMoveTask, onDeleteTask, githubConfigured, projects }: Props) {
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
        <div className="list-view">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.key);
            const isCollapsed = collapsed[col.key];

            return (
              <div className="list-group" key={col.key}>
                <div className="list-group-header" onClick={() => toggle(col.key)}>
                  <div className="list-group-left">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <h3>{col.label}</h3>
                    <span className="count">{columnTasks.length}</span>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCreate(col.key);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {!isCollapsed && (
                  <Droppable droppableId={col.key}>
                    {(provided, snapshot) => (
                      <div
                        className={`list-table ${snapshot.isDraggingOver ? "list-drag-over" : ""}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {columnTasks.length > 0 && (
                          <div className="list-row list-header-row">
                            <div className="list-cell list-cell-grip"></div>
                            <div className="list-cell list-cell-title">Título</div>
                            <div className="list-cell list-cell-priority">Prioridade</div>
                            <div className="list-cell list-cell-assignee">Responsável</div>
                            <div className="list-cell list-cell-date">Início</div>
                            <div className="list-cell list-cell-date">Fim</div>
                            <div className="list-cell list-cell-actions"></div>
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
                          <p className="empty-text">Nenhuma tarefa</p>
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
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          developers={developers}
          onSave={(data) => onUpdateTask(editingTask.id, data)}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}
