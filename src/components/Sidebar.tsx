import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  LayoutGrid,
  List,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Monitor,
  LogOut,
  UserCircle,
  UserCheck,
  UserX,
  GitBranch,
  Zap,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User, Project, Sprint, Task } from "../types";
import { DevModal } from "./DevModal";
import { ProjectModal } from "./ProjectModal";
import { SprintModal } from "./SprintModal";
import { SprintCompleteModal } from "./SprintCompleteModal";

type ViewMode = "board" | "list" | "tv";

interface Props {
  currentUser: User;
  developers: User[];
  projects: Project[];
  githubConfigured: boolean;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onCreateDev: (data: Omit<User, "id" | "createdAt">) => void;
  onUpdateDev: (id: string, data: Partial<User>) => void;
  onDeleteDev: (id: string) => void;
  onToggleActive: (id: string) => void;
  onCreateProject: (data: { name: string; githubOwner: string; githubRepo: string; defaultBranch: string }) => void;
  onUpdateProject: (id: string, data: { name: string; githubOwner: string; githubRepo: string; defaultBranch: string }) => void;
  onDeleteProject: (id: string) => void;
  onLogout: () => void;
  sprints: Sprint[];
  tasks: Task[];
  selectedSprintId: string | null;
  onSelectSprint: (id: string | null) => void;
  onCreateSprint: (data: { name: string; goal?: string; startDate: string; endDate: string }) => void;
  onUpdateSprint: (id: string, data: Partial<Pick<Sprint, "name" | "goal" | "startDate" | "endDate" | "status">>) => void;
  onDeleteSprint: (id: string) => void;
  onCompleteSprint: (id: string, moves: { taskId: string; target: string | null }[]) => void;
}

export function Sidebar({
  currentUser,
  developers,
  projects,
  githubConfigured,
  view,
  onViewChange,
  onCreateDev,
  onUpdateDev,
  onDeleteDev,
  onToggleActive,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onLogout,
  sprints,
  tasks,
  selectedSprintId,
  onSelectSprint,
  onCreateSprint,
  onUpdateSprint,
  onDeleteSprint,
  onCompleteSprint,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [usersOpen, setUsersOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDev, setEditingDev] = useState<User | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sprintsOpen, setSprintsOpen] = useState(true);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [completingSprint, setCompletingSprint] = useState<Sprint | null>(null);
  const navigate = useNavigate();
  const isAdmin = currentUser.role === "admin";

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
  const sortedSprints = [...sprints].sort((a, b) => {
    const order = { active: 0, planning: 1, completed: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <>
      <aside className={cn(
        "flex flex-col border-r border-border/30 bg-sidebar transition-[width] duration-300",
        collapsed ? "w-[60px]" : "w-[260px]"
      )}>
        {/* Top: Logo + Nav */}
        <div className="space-y-1 p-3">
          <div className="flex items-center justify-between pb-2">
            {!collapsed && <img src="/logo.png" alt="TaskQue" className="h-7 object-contain" />}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expandir" : "Recolher"}
              className={cn(collapsed && "mx-auto")}
            >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </Button>
          </div>

          <nav className="space-y-0.5">
            {([
              { key: "board" as const, icon: LayoutGrid, label: "Board" },
              { key: "list" as const, icon: List, label: "Lista" },
              { key: "tv" as const, icon: Monitor, label: "Painel TV" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all",
                  view === key
                    ? "bg-primary/10 text-primary glow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border border-transparent"
                )}
                onClick={() => onViewChange(key)}
                title={label}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Sprints section */}
        <div className="border-t border-border/20 px-3 py-2">
          <button
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => !collapsed && setSprintsOpen(!sprintsOpen)}
            title="Sprints"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} />
              {!collapsed && (
                <>
                  <span>Sprints</span>
                  <Badge variant="secondary" className="text-[0.55rem] px-1 py-0">{sprints.length}</Badge>
                </>
              )}
            </div>
            {!collapsed && (
              sprintsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            )}
          </button>

          {sprintsOpen && !collapsed && (
            <div className="mt-1 space-y-0.5">
              {sortedSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={cn(
                    "group cursor-pointer rounded-md px-2 py-1.5 transition-all",
                    selectedSprintId === sprint.id
                      ? "bg-primary/10 border border-primary/20 glow-sm"
                      : "hover:bg-secondary/20 border border-transparent",
                    sprint.status === "active" && selectedSprintId !== sprint.id && "border-success/10"
                  )}
                  onClick={() => onSelectSprint(selectedSprintId === sprint.id ? null : sprint.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sprintStatusColors[sprint.status] }} />
                    <span className="flex-1 truncate text-xs font-medium">{sprint.name}</span>
                    {isAdmin && (
                      <div className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                        {sprint.status === "planning" && (
                          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onUpdateSprint(sprint.id, { status: "active" }); }} title="Ativar sprint">
                            <Play size={11} />
                          </Button>
                        )}
                        {sprint.status === "active" && (
                          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setCompletingSprint(sprint); }} title="Completar sprint">
                            <CheckCircle2 size={11} />
                          </Button>
                        )}
                        {sprint.status !== "completed" && (
                          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setEditingSprint(sprint); }} title="Editar">
                            <Pencil size={11} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); onDeleteSprint(sprint.id); }} title="Excluir">
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-[0.6rem] text-muted-foreground">
                      {new Date(sprint.startDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      {" → "}
                      {new Date(sprint.endDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    <Badge
                      className="text-[0.5rem] px-1 py-0 border-0"
                      style={{ backgroundColor: sprintStatusColors[sprint.status], color: "#fff" }}
                    >
                      {sprintStatusLabels[sprint.status]}
                    </Badge>
                  </div>
                </div>
              ))}
              {sprints.length === 0 && (
                <p className="py-2 text-center text-[0.65rem] text-muted-foreground">Nenhuma sprint</p>
              )}
              {isAdmin && (
                <button
                  className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/40 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  onClick={() => setShowCreateSprint(true)}
                >
                  <Plus size={13} />
                  <span>Nova sprint</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Users section */}
        <div className="border-t border-border/20 px-3 py-2">
          <button
            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => !collapsed && setUsersOpen(!usersOpen)}
            title="Usuários"
          >
            <div className="flex items-center gap-2">
              <Users size={14} />
              {!collapsed && (
                <>
                  <span>Usuários</span>
                  <Badge variant="secondary" className="text-[0.55rem] px-1 py-0">{developers.length}</Badge>
                </>
              )}
            </div>
            {!collapsed && (
              usersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            )}
          </button>

          {(usersOpen || collapsed) && (
            <div className="mt-1">
              {!collapsed ? (
                <div className="space-y-0.5">
                  {developers.map((dev) => (
                    <div className={cn("group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/20", !dev.active && "opacity-50")} key={dev.id}>
                      <span
                        className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                        style={{ backgroundColor: dev.active ? dev.color : "#4b5563" }}
                      >
                        {dev.avatar}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-xs font-medium">{dev.name}</span>
                        {!dev.active && <span className="text-[0.55rem] font-medium uppercase text-destructive">Inativo</span>}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon-xs" onClick={() => onToggleActive(dev.id)} title={dev.active ? "Desativar" : "Ativar"}>
                            {dev.active ? <UserX size={11} /> : <UserCheck size={11} />}
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => setEditingDev(dev)}>
                            <Pencil size={11} />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => onDeleteDev(dev.id)}>
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {developers.length === 0 && (
                    <p className="py-2 text-center text-[0.65rem] text-muted-foreground">Nenhum usuário</p>
                  )}
                  {isAdmin && (
                    <button
                      className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/40 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={13} />
                      <span>Novo usuário</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 py-1">
                  {developers.slice(0, 5).map((dev) => (
                    <span
                      key={dev.id}
                      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                      style={{ backgroundColor: dev.color }}
                      title={dev.name}
                    >
                      {dev.avatar}
                    </span>
                  ))}
                  {isAdmin && (
                    <Button variant="ghost" size="icon-xs" onClick={() => setShowCreate(true)} title="Novo usuário">
                      <Plus size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects section */}
        {isAdmin && githubConfigured && (
          <div className="border-t border-border/20 px-3 py-2">
            <button
              className="flex w-full items-center justify-between rounded-md px-1 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => !collapsed && setProjectsOpen(!projectsOpen)}
              title="Projetos GitHub"
            >
              <div className="flex items-center gap-2">
                <GitBranch size={14} />
                {!collapsed && (
                  <>
                    <span>Projetos</span>
                    <Badge variant="secondary" className="text-[0.55rem] px-1 py-0">{projects.length}</Badge>
                  </>
                )}
              </div>
              {!collapsed && (
                projectsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
              )}
            </button>

            {(projectsOpen || collapsed) && (
              <div className="mt-1">
                {!collapsed ? (
                  <div className="space-y-0.5">
                    {projects.map((project) => (
                      <div className="group flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/20" key={project.id}>
                        <GitBranch size={14} className="shrink-0 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <span className="block truncate text-xs font-medium">{project.name}</span>
                          <span className="text-[0.55rem] text-muted-foreground">
                            {project.githubOwner}/{project.githubRepo}
                          </span>
                        </div>
                        <div className="flex gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon-xs" onClick={() => setEditingProject(project)}>
                            <Pencil size={11} />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => onDeleteProject(project.id)}>
                            <Trash2 size={11} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="py-2 text-center text-[0.65rem] text-muted-foreground">Nenhum projeto</p>
                    )}
                    <button
                      className="flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/40 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                      onClick={() => setShowCreateProject(true)}
                    >
                      <Plus size={13} />
                      <span>Novo projeto</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => setShowCreateProject(true)} title="Novo projeto">
                      <GitBranch size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom: User Profile + Logout */}
        <div className="mt-auto border-t border-border/20 p-3 space-y-1">
          <div
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/20"
            onClick={() => navigate("/profile")}
            title="Meu perfil"
          >
            <span
              className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </span>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <span className="block truncate text-xs font-medium">{currentUser.name}</span>
                <span className="text-[0.55rem] text-muted-foreground">
                  {currentUser.role === "admin" ? "Admin" : "Membro"}
                </span>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); navigate("/profile"); }} title="Perfil">
                <UserCircle size={14} />
              </Button>
            )}
          </div>

          <button
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={onLogout}
            title="Sair"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {showCreate && (
        <DevModal onSave={onCreateDev as unknown as (data: Record<string, string>) => void} onClose={() => setShowCreate(false)} showAuth />
      )}
      {editingDev && (
        <DevModal
          developer={editingDev}
          onSave={(data) => onUpdateDev(editingDev.id, data)}
          onClose={() => setEditingDev(null)}
        />
      )}
      {showCreateProject && (
        <ProjectModal
          onSave={onCreateProject}
          onClose={() => setShowCreateProject(false)}
        />
      )}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          onSave={(data) => onUpdateProject(editingProject.id, data)}
          onClose={() => setEditingProject(null)}
        />
      )}
      {showCreateSprint && (
        <SprintModal
          onSave={onCreateSprint}
          onClose={() => setShowCreateSprint(false)}
        />
      )}
      {editingSprint && (
        <SprintModal
          sprint={editingSprint}
          onSave={(data) => onUpdateSprint(editingSprint.id, data)}
          onClose={() => setEditingSprint(null)}
        />
      )}
      {completingSprint && (
        <SprintCompleteModal
          sprint={completingSprint}
          tasks={tasks}
          planningSprints={sprints.filter((s) => s.status === "planning")}
          onComplete={(moves) => onCompleteSprint(completingSprint.id, moves)}
          onClose={() => setCompletingSprint(null)}
        />
      )}
    </>
  );
}
