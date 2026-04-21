import { useState, useRef, useEffect } from "react";
import { X, GitBranch, Plus, Trash2, CheckSquare, Square, Pencil, Calendar, Send, Zap } from "lucide-react";
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
  onSave: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[] }) => void;
  onClose: () => void;
  sprints?: Sprint[];
  selectedSprintId?: string | null;
}

function formatDateShort(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
    <div className="inline-dropdown" ref={ref}>
      <button type="button" className="inline-chip" onClick={onToggle}>{trigger}</button>
      {open && <div className="inline-dropdown-menu">{children}</div>}
    </div>
  );
}

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
    if (!newSubtaskTitle.trim() || !task) return;
    createSubtask(task.id, newSubtaskTitle.trim());
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
    });
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
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal task-modal ${task ? "task-modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="task-modal-close" onClick={onClose}><X size={18} /></button>

        <div className={task ? "task-modal-split" : ""}>
        <div className="task-modal-main">

        {/* Title */}
        <div className="task-modal-title">
          {editingTitle ? (
            <input
              ref={titleRef}
              className="task-modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") handleTitleBlur(); }}
              placeholder="Título da tarefa"
            />
          ) : (
            <>
              <h2 onClick={() => setEditingTitle(true)}>{title || "Sem título"}</h2>
              <button className="btn-icon-sm" onClick={() => setEditingTitle(true)}><Pencil size={14} /></button>
            </>
          )}
        </div>

        {/* Description */}
        <textarea
          className="task-modal-desc"
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
        <div className="task-modal-meta">
          <InlineDropdown
            open={openDropdown === "status"}
            onToggle={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
            trigger={<><span className="chip-dot" style={{ background: statusColors[status] }} />{statusInfo?.label}</>}
          >
            {COLUMNS.map((c) => (
              <button key={c.key} className={`dropdown-item ${status === c.key ? "active" : ""}`} onClick={() => handleStatusChange(c.key)}>
                <span className="chip-dot" style={{ background: statusColors[c.key] }} />{c.label}
              </button>
            ))}
          </InlineDropdown>

          <InlineDropdown
            open={openDropdown === "priority"}
            onToggle={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}
            trigger={<><span className="chip-dot" style={{ background: priorityInfo?.color }} />{priorityInfo?.label}</>}
          >
            {PRIORITIES.map((p) => (
              <button key={p.key} className={`dropdown-item ${priority === p.key ? "active" : ""}`} onClick={() => handlePriorityChange(p.key)}>
                <span className="chip-dot" style={{ background: p.color }} />{p.label}
              </button>
            ))}
          </InlineDropdown>

          <InlineDropdown
            open={openDropdown === "assignee"}
            onToggle={() => setOpenDropdown(openDropdown === "assignee" ? null : "assignee")}
            trigger={
              assignee
                ? <><span className="avatar-xs" style={{ background: assignee.color }}>{assignee.avatar}</span>{assignee.name}</>
                : <span style={{ color: "var(--text-muted)" }}>Responsável</span>
            }
          >
            <button className={`dropdown-item ${!assigneeId ? "active" : ""}`} onClick={() => handleAssigneeChange("")}>
              Sem responsável
            </button>
            {developers.map((d) => (
              <button key={d.id} className={`dropdown-item ${assigneeId === d.id ? "active" : ""}`} onClick={() => handleAssigneeChange(d.id)}>
                <span className="avatar-xs" style={{ background: d.color }}>{d.avatar}</span>{d.name}
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
                  : <span style={{ color: "var(--text-muted)" }}><Zap size={13} /> Sprint</span>
              }
            >
              <button className={`dropdown-item ${!sprintId ? "active" : ""}`} onClick={() => handleSprintChange("")}>
                Sem sprint (Backlog)
              </button>
              {sprints.filter((s) => s.status !== "completed").map((s) => (
                <button key={s.id} className={`dropdown-item ${sprintId === s.id ? "active" : ""}`} onClick={() => handleSprintChange(s.id)}>
                  <span className="chip-dot" style={{ background: s.status === "active" ? "#22c55e" : "#3b82f6" }} />{s.name}
                </button>
              ))}
            </InlineDropdown>
          )}

          <div className="inline-chip date-chip">
            <Calendar size={13} />
            <input type="date" value={startDate} onChange={(e) => handleDateChange("startDate", e.target.value)} />
            <span>→</span>
            <input type="date" value={endDate} onChange={(e) => handleDateChange("endDate", e.target.value)} min={startDate || undefined} />
          </div>
        </div>

        {/* Branches (edit mode) */}
        {task && task.branches && task.branches.length > 0 && (
          <div className="task-modal-section">
            <div className="task-modal-section-title"><GitBranch size={14} /> Branches</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {task.branches.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a78bfa" }}>
                  <GitBranch size={12} />
                  <span style={{ color: "var(--text-secondary)" }}>{b.projectName}:</span>
                  <code>{b.branchName}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branch creation (new task mode) */}
        {isNew && showBranchSection && (
          <div className="task-modal-section">
            <div className="task-modal-section-title"><GitBranch size={14} /> Criar branch nos projetos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {projects.map((project) => (
                <label key={project.id} className="subtask-item" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    style={{ width: "auto" }}
                  />
                  <span style={{ fontWeight: 500 }}>{project.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {project.githubOwner}/{project.githubRepo}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Subtasks */}
        <div className="task-modal-section">
          <div className="task-modal-section-title">
            <CheckSquare size={14} /> Subtarefas
            {subtasks.length > 0 && <span className="subtask-counter">{doneCount}/{subtasks.length}</span>}
          </div>

          {subtasks.length > 0 && (
            <div className="subtask-progress-bar" style={{ marginBottom: 8 }}>
              <div className="subtask-progress-fill" style={{ width: `${(doneCount / subtasks.length) * 100}%` }} />
            </div>
          )}

          <div className="subtask-list">
            {subtasks.map((s) => (
              <div key={s.id} className={`subtask-item ${s.done ? "subtask-done" : ""}`}>
                <button type="button" className="subtask-check" onClick={() => toggleSubtask(s.id)}>
                  {s.done ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span className="subtask-title">{s.title}</span>
                <button type="button" className="subtask-delete" onClick={() => deleteSubtask(s.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {task ? (
            <div className="subtask-add">
              <Plus size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Adicionar subtarefa"
              />
            </div>
          ) : null}
        </div>

        {/* Create button (new task only) */}
        {isNew && (
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleCreate}>Criar</button>
          </div>
        )}

        </div>{/* end task-modal-main */}

        {/* Comments sidebar */}
        {task && (
          <div className="task-modal-comments">
            <Comments taskId={task.id} />
          </div>
        )}

        </div>{/* end task-modal-split */}
      </div>
    </div>
  );
}
