import { useState, useRef, useEffect } from "react";
import { GitBranch, Plus, Trash2, CheckSquare, Square, Pencil, Calendar, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Developer, Task, TaskStatus, Project, Sprint } from "../types";
import { COLUMNS, PRIORITIES } from "../types";
import { Comments } from "./Comments";
import { useStore } from "../contexts/StoreContext";

interface Props {
  task?: Task;
  developers: Developer[];
  projects?: Project[];
  defaultStatus?: TaskStatus;
  githubConfigured?: boolean;
  onSave: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[]; subtaskTitles?: string[] }) => void;
  onClose: () => void;
  sprints?: Sprint[];
  selectedSprintId?: string | null;
}

function InlineDropdown({ trigger, children, open, onToggle }: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/30 px-2.5 py-1 text-xs font-medium transition-colors hover:border-primary/30 hover:bg-secondary/50"
        onClick={onToggle}
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border/50 bg-card/95 p-1 shadow-lg backdrop-blur-xl animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  backlog: "#64748b",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  review: "#a855f7",
  done: "#22c55e",
};

export function TaskModal({ task, developers, projects = [], defaultStatus = "backlog", githubConfigured, onSave, onClose, sprints = [], selectedSprintId }: Props) {
  const { createSubtask, toggleSubtask, deleteSubtask, updateTask } = useStore();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus);
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [startDate, setStartDate] = useState(task?.startDate || "");
  const [endDate, setEndDate] = useState(task?.endDate || "");
  const [sprintId, setSprintId] = useState<string | null>(
    task?.sprintId ?? (selectedSprintId && selectedSprintId !== "backlog" ? selectedSprintId : null)
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([]);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(!task);
  const titleRef = useRef<HTMLInputElement>(null);

  const isNew = !task;
  const showBranchSection = githubConfigured && projects.length > 0;
  const subtasks = task?.subtasks || [];
  const doneCount = subtasks.filter((s) => s.done).length;
  const priorityInfo = PRIORITIES.find((p) => p.key === priority);
  const statusInfo = COLUMNS.find((c) => c.key === status);
  const assignee = developers.find((d) => d.id === assigneeId);

  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus();
  }, [editingTitle]);

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleFieldChange = (field: string, value: string | null) => {
    if (!task) return;
    updateTask(task.id, { [field]: value });
  };

  const handleStatusChange = (val: TaskStatus) => {
    setStatus(val);
    setOpenDropdown(null);
    if (task) handleFieldChange("status", val);
  };

  const handlePriorityChange = (val: Task["priority"]) => {
    setPriority(val);
    setOpenDropdown(null);
    if (task) handleFieldChange("priority", val);
  };

  const handleAssigneeChange = (val: string) => {
    setAssigneeId(val);
    setOpenDropdown(null);
    if (task) handleFieldChange("assigneeId", val || null);
  };

  const handleSprintChange = (val: string) => {
    setSprintId(val || null);
    setOpenDropdown(null);
    if (task) handleFieldChange("sprintId", val || null);
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (task && title.trim() && title !== task.title) {
      handleFieldChange("title", title.trim());
    }
  };

  const handleDescriptionBlur = () => {
    if (task && description !== task.description) {
      handleFieldChange("description", description.trim());
    }
  };

  const handleDateChange = (field: "startDate" | "endDate", val: string) => {
    if (field === "startDate") setStartDate(val);
    else setEndDate(val);
    if (task) handleFieldChange(field, val || null);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    if (task) {
      createSubtask(task.id, newSubtaskTitle.trim());
    } else {
      setPendingSubtasks((prev) => [...prev, newSubtaskTitle.trim()]);
    }
    setNewSubtaskTitle("");
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId: assigneeId || null,
      sprintId,
      startDate: startDate || null,
      endDate: endDate || null,
      ...(isNew && selectedProjectIds.length > 0 ? { branchProjectIds: selectedProjectIds } : {}),
      ...(isNew && pendingSubtasks.length > 0 ? { subtaskTitles: pendingSubtasks } : {}),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={cn(
        "border-border/50 bg-card/95 backdrop-blur-xl p-0 gap-0",
        task ? "sm:max-w-[780px]" : "sm:max-w-[520px]"
      )}>
        <DialogTitle className="sr-only">{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        <div className={task ? "flex gap-0" : ""}>
          <div className={cn("flex-1 space-y-4 p-5", task && "border-r border-border/30")}>
            {/* Title */}
            <div className="flex items-center gap-2 pr-8">
              {editingTitle ? (
                <input
                  ref={titleRef}
                  className="w-full bg-transparent text-lg font-semibold text-foreground placeholder:text-muted-foreground outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTitleBlur(); }}
                  placeholder="Título da tarefa"
                />
              ) : (
                <>
                  <Button variant="ghost" size="icon-xs" className="shrink-0" onClick={() => setEditingTitle(true)}>
                    <Pencil size={14} />
                  </Button>
                  <h2 className="flex-1 cursor-pointer text-lg font-semibold" onClick={() => setEditingTitle(true)}>
                    {title || "Sem título"}
                  </h2>
                </>
              )}
            </div>

            {/* Description */}
            <textarea
              className="w-full resize-none rounded-md border-0 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Adicionar descrição..."
              rows={3}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.max(72, el.scrollHeight) + "px";
              }}
            />

            {/* Inline metadata chips */}
            <div className="flex flex-wrap items-center gap-2">
              <InlineDropdown
                open={openDropdown === "status"}
                onToggle={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
                trigger={<><span className="inline-block h-2 w-2 rounded-full" style={{ background: statusColors[status] }} />{statusInfo?.label}</>}
              >
                {COLUMNS.map((c) => (
                  <button
                    key={c.key}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50",
                      status === c.key && "bg-primary/10 text-primary"
                    )}
                    onClick={() => handleStatusChange(c.key)}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: statusColors[c.key] }} />{c.label}
                  </button>
                ))}
              </InlineDropdown>

              <InlineDropdown
                open={openDropdown === "priority"}
                onToggle={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}
                trigger={<><span className="inline-block h-2 w-2 rounded-full" style={{ background: priorityInfo?.color }} />{priorityInfo?.label}</>}
              >
                {PRIORITIES.map((p) => (
                  <button
                    key={p.key}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50",
                      priority === p.key && "bg-primary/10 text-primary"
                    )}
                    onClick={() => handlePriorityChange(p.key)}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />{p.label}
                  </button>
                ))}
              </InlineDropdown>

              <InlineDropdown
                open={openDropdown === "assignee"}
                onToggle={() => setOpenDropdown(openDropdown === "assignee" ? null : "assignee")}
                trigger={
                  assignee
                    ? <>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.5rem] font-bold text-white" style={{ background: assignee.color }}>{assignee.avatar}</span>
                        {assignee.name}
                      </>
                    : <span className="text-muted-foreground">Responsável</span>
                }
              >
                <button
                  className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50", !assigneeId && "bg-primary/10 text-primary")}
                  onClick={() => handleAssigneeChange("")}
                >
                  Sem responsável
                </button>
                {developers.map((d) => (
                  <button
                    key={d.id}
                    className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50", assigneeId === d.id && "bg-primary/10 text-primary")}
                    onClick={() => handleAssigneeChange(d.id)}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[0.5rem] font-bold text-white" style={{ background: d.color }}>{d.avatar}</span>
                    {d.name}
                  </button>
                ))}
              </InlineDropdown>

              {sprints.length > 0 && (
                <InlineDropdown
                  open={openDropdown === "sprint"}
                  onToggle={() => setOpenDropdown(openDropdown === "sprint" ? null : "sprint")}
                  trigger={
                    sprintId
                      ? <><Zap size={13} />{sprints.find((s) => s.id === sprintId)?.name || "Sprint"}</>
                      : <span className="text-muted-foreground"><Zap size={13} /> Sprint</span>
                  }
                >
                  <button
                    className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50", !sprintId && "bg-primary/10 text-primary")}
                    onClick={() => handleSprintChange("")}
                  >
                    Sem sprint (Backlog)
                  </button>
                  {sprints.filter((s) => s.status !== "completed").map((s) => (
                    <button
                      key={s.id}
                      className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-secondary/50", sprintId === s.id && "bg-primary/10 text-primary")}
                      onClick={() => handleSprintChange(s.id)}
                    >
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.status === "active" ? "#22c55e" : "#3b82f6" }} />{s.name}
                    </button>
                  ))}
                </InlineDropdown>
              )}

              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/30 px-2.5 py-1 text-xs">
                <Calendar size={13} className="text-muted-foreground" />
                <input
                  type="date"
                  className="bg-transparent text-xs text-foreground outline-none [color-scheme:dark]"
                  value={startDate}
                  onChange={(e) => handleDateChange("startDate", e.target.value)}
                />
                <span className="text-muted-foreground">→</span>
                <input
                  type="date"
                  className="bg-transparent text-xs text-foreground outline-none [color-scheme:dark]"
                  value={endDate}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>

            {/* Branches (edit mode) */}
            {task && task.branches && task.branches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <GitBranch size={14} /> Branches
                </div>
                <div className="space-y-1">
                  {task.branches.map((b) => (
                    <div key={b.id} className="flex items-center gap-1.5 text-xs">
                      <GitBranch size={12} className="text-purple-400" />
                      <span className="text-muted-foreground">{b.projectName}:</span>
                      <code className="text-purple-400">{b.branchName}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branch creation (new task mode) */}
            {isNew && showBranchSection && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <GitBranch size={14} /> Criar branch nos projetos
                </div>
                <div className="space-y-1">
                  {projects.map((project) => (
                    <label key={project.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-secondary/30">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        className="rounded border-border"
                      />
                      <span className="font-medium text-xs">{project.name}</span>
                      <span className="text-[0.65rem] text-muted-foreground">
                        {project.githubOwner}/{project.githubRepo}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CheckSquare size={14} /> Subtarefas
                {(subtasks.length > 0 || pendingSubtasks.length > 0) && (
                  <Badge variant="secondary" className="ml-1 text-[0.6rem] px-1.5 py-0">
                    {task ? `${doneCount}/${subtasks.length}` : pendingSubtasks.length}
                  </Badge>
                )}
              </div>

              {subtasks.length > 0 && (
                <Progress value={(doneCount / subtasks.length) * 100} className="h-1.5" />
              )}

              <div className="space-y-1">
                {/* Existing subtasks (edit mode) */}
                {subtasks.map((s) => (
                  <div key={s.id} className={cn("group/sub flex items-center gap-2 rounded-md px-1 py-1 text-sm", s.done && "opacity-50")}>
                    <button type="button" className="text-muted-foreground hover:text-primary transition-colors" onClick={() => toggleSubtask(s.id)}>
                      {s.done ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <span className={cn("flex-1 text-xs", s.done && "line-through")}>{s.title}</span>
                    <button
                      type="button"
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/sub:opacity-100"
                      onClick={() => deleteSubtask(s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {/* Pending subtasks (create mode) */}
                {pendingSubtasks.map((title, i) => (
                  <div key={i} className="group/sub flex items-center gap-2 rounded-md px-1 py-1 text-sm">
                    <Square size={16} className="text-muted-foreground" />
                    <span className="flex-1 text-xs">{title}</span>
                    <button
                      type="button"
                      className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/sub:opacity-100"
                      onClick={() => setPendingSubtasks((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-md border border-dashed border-border/50 px-2 py-1.5">
                <Plus size={14} className="shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                  placeholder="Adicionar subtarefa"
                />
              </div>
            </div>

            {/* Create button (new task only) */}
            {isNew && (
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreate();
                  }}
                >
                  Criar
                </Button>
              </div>
            )}
          </div>

          {/* Comments sidebar */}
          {task && (
            <div className="w-[280px] shrink-0 p-4">
              <Comments taskId={task.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
