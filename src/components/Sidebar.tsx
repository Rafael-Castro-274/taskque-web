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
  Sun,
  Moon,
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
import type { User, Project, Sprint, Task } from "../types";
import { DevModal } from "./DevModal";
import { ProjectModal } from "./ProjectModal";
import { SprintModal } from "./SprintModal";
import { SprintCompleteModal } from "./SprintCompleteModal";

type ViewMode = "board" | "list" | "tv";
type Theme = "dark" | "light";

interface Props {
  currentUser: User;
  developers: User[];
  projects: Project[];
  githubConfigured: boolean;
  view: ViewMode;
  theme: Theme;
  onViewChange: (view: ViewMode) => void;
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
  theme,
  onViewChange,
  onToggleTheme,
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
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {!collapsed && <img src="/logo.png" alt="TaskQue" className="sidebar-logo-img" />}
            <button
              className="btn-icon sidebar-toggle"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expandir" : "Recolher"}
            >
              {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`sidebar-nav-item ${view === "board" ? "active" : ""}`}
              onClick={() => onViewChange("board")}
              title="Board"
            >
              <LayoutGrid size={18} />
              {!collapsed && <span>Board</span>}
            </button>
            <button
              className={`sidebar-nav-item ${view === "list" ? "active" : ""}`}
              onClick={() => onViewChange("list")}
              title="Lista"
            >
              <List size={18} />
              {!collapsed && <span>Lista</span>}
            </button>
            <button
              className={`sidebar-nav-item ${view === "tv" ? "active" : ""}`}
              onClick={() => onViewChange("tv")}
              title="Painel TV"
            >
              <Monitor size={18} />
              {!collapsed && <span>Painel TV</span>}
            </button>
          </nav>
        </div>

        {/* Sprints section */}
        <div className="sidebar-section">
          <button
            className="sidebar-section-header"
            onClick={() => !collapsed && setSprintsOpen(!sprintsOpen)}
            title="Sprints"
          >
            <div className="sidebar-section-left">
              <Zap size={16} />
              {!collapsed && (
                <>
                  <span>Sprints</span>
                  <span className="sidebar-count">{sprints.length}</span>
                </>
              )}
            </div>
            {!collapsed && (
              <span className="sidebar-chevron">
                {sprintsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
          </button>

          {(sprintsOpen || collapsed) && !collapsed && (
            <div className="sidebar-section-body">
              {sortedSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`sprint-item ${selectedSprintId === sprint.id ? "sprint-item-selected" : ""} ${sprint.status === "active" ? "sprint-item-active" : ""}`}
                  onClick={() => onSelectSprint(selectedSprintId === sprint.id ? null : sprint.id)}
                >
                  <div className="sprint-item-header">
                    <span className="sprint-dot" style={{ backgroundColor: sprintStatusColors[sprint.status] }} />
                    <span className="sprint-item-name">{sprint.name}</span>
                    {isAdmin && (
                      <div className="user-actions">
                      {sprint.status === "planning" && (
                        <button
                          className="btn-icon-sm"
                          onClick={(e) => { e.stopPropagation(); onUpdateSprint(sprint.id, { status: "active" }); }}
                          title="Ativar sprint"
                        >
                          <Play size={13} />
                        </button>
                      )}
                      {sprint.status === "active" && (
                        <button
                          className="btn-icon-sm"
                          onClick={(e) => { e.stopPropagation(); setCompletingSprint(sprint); }}
                          title="Completar sprint"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      )}
                      {sprint.status !== "completed" && (
                        <button
                          className="btn-icon-sm"
                          onClick={(e) => { e.stopPropagation(); setEditingSprint(sprint); }}
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                      <button
                        className="btn-icon-sm"
                        onClick={(e) => { e.stopPropagation(); onDeleteSprint(sprint.id); }}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    )}
                  </div>
                  <div className="sprint-item-footer">
                    <span className="sprint-item-dates">
                      {new Date(sprint.startDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      {" → "}
                      {new Date(sprint.endDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    <span className="sprint-badge" style={{ backgroundColor: sprintStatusColors[sprint.status] }}>
                      {sprintStatusLabels[sprint.status]}
                    </span>
                  </div>
                </div>
              ))}
              {sprints.length === 0 && (
                <p className="empty-text">Nenhuma sprint</p>
              )}
              {isAdmin && (
                <button
                  className="sidebar-add-btn"
                  onClick={() => setShowCreateSprint(true)}
                >
                  <Plus size={15} />
                  <span>Nova sprint</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <button
            className="sidebar-section-header"
            onClick={() => !collapsed && setUsersOpen(!usersOpen)}
            title="Usuários"
          >
            <div className="sidebar-section-left">
              <Users size={16} />
              {!collapsed && (
                <>
                  <span>Usuários</span>
                  <span className="sidebar-count">{developers.length}</span>
                </>
              )}
            </div>
            {!collapsed && (
              <span className="sidebar-chevron">
                {usersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
          </button>

          {(usersOpen || collapsed) && (
            <div className="sidebar-section-body">
              {!collapsed ? (
                <>
                  {developers.map((dev) => (
                    <div className={`user-item ${!dev.active ? "user-inactive" : ""}`} key={dev.id}>
                      <span className="avatar-sm" style={{ backgroundColor: dev.active ? dev.color : "#4b5563" }}>
                        {dev.avatar}
                      </span>
                      <div className="user-name-wrap">
                        <span className="user-name">{dev.name}</span>
                        {!dev.active && <span className="user-badge-inactive">Inativo</span>}
                      </div>
                      {isAdmin && (
                        <div className="user-actions">
                          <button
                            className="btn-icon-sm"
                            onClick={() => onToggleActive(dev.id)}
                            title={dev.active ? "Desativar" : "Ativar"}
                          >
                            {dev.active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                          <button className="btn-icon-sm" onClick={() => setEditingDev(dev)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn-icon-sm" onClick={() => onDeleteDev(dev.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {developers.length === 0 && (
                    <p className="empty-text">Nenhum usuário</p>
                  )}
                  {isAdmin && (
                    <button
                      className="sidebar-add-btn"
                      onClick={() => setShowCreate(true)}
                    >
                      <Plus size={15} />
                      <span>Novo usuário</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="sidebar-collapsed-users">
                  {developers.slice(0, 5).map((dev) => (
                    <span
                      key={dev.id}
                      className="avatar-sm"
                      style={{ backgroundColor: dev.color }}
                      title={dev.name}
                    >
                      {dev.avatar}
                    </span>
                  ))}
                  {isAdmin && (
                    <button
                      className="btn-icon sidebar-add-icon"
                      onClick={() => setShowCreate(true)}
                      title="Novo usuário"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects section - only visible for admins when GitHub is configured */}
        {isAdmin && githubConfigured && (
          <div className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() => !collapsed && setProjectsOpen(!projectsOpen)}
              title="Projetos GitHub"
            >
              <div className="sidebar-section-left">
                <GitBranch size={16} />
                {!collapsed && (
                  <>
                    <span>Projetos</span>
                    <span className="sidebar-count">{projects.length}</span>
                  </>
                )}
              </div>
              {!collapsed && (
                <span className="sidebar-chevron">
                  {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </button>

            {(projectsOpen || collapsed) && (
              <div className="sidebar-section-body">
                {!collapsed ? (
                  <>
                    {projects.map((project) => (
                      <div className="user-item" key={project.id}>
                        <GitBranch size={14} style={{ flexShrink: 0, color: "#a78bfa" }} />
                        <div className="user-name-wrap">
                          <span className="user-name">{project.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            {project.githubOwner}/{project.githubRepo}
                          </span>
                        </div>
                        <div className="user-actions">
                          <button className="btn-icon-sm" onClick={() => setEditingProject(project)}>
                            <Pencil size={13} />
                          </button>
                          <button className="btn-icon-sm" onClick={() => onDeleteProject(project.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="empty-text">Nenhum projeto</p>
                    )}
                    <button
                      className="sidebar-add-btn"
                      onClick={() => setShowCreateProject(true)}
                    >
                      <Plus size={15} />
                      <span>Novo projeto</span>
                    </button>
                  </>
                ) : (
                  <div className="sidebar-collapsed-users">
                    <button
                      className="btn-icon sidebar-add-icon"
                      onClick={() => setShowCreateProject(true)}
                      title="Novo projeto"
                    >
                      <GitBranch size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="sidebar-bottom">
          <div className="sidebar-user-profile" onClick={() => navigate("/profile")} title="Meu perfil">
            <span className="avatar-sm" style={{ backgroundColor: currentUser.color }}>
              {currentUser.avatar}
            </span>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.name}</span>
                <span className="sidebar-user-role">
                  {currentUser.role === "admin" ? "Admin" : "Membro"}
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                className="btn-icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/profile");
                }}
                title="Perfil"
              >
                <UserCircle size={15} />
              </button>
            )}
          </div>

          <div className="sidebar-bottom-actions">
            <button
              className="theme-toggle"
              onClick={onToggleTheme}
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            >
              <div className="theme-toggle-track">
                <div className={`theme-toggle-thumb ${theme}`}>
                  {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                </div>
                <Sun size={11} className="theme-icon-light" />
                <Moon size={11} className="theme-icon-dark" />
              </div>
              {!collapsed && <span>{theme === "dark" ? "Escuro" : "Claro"}</span>}
            </button>

            <button
              className="sidebar-logout"
              onClick={onLogout}
              title="Sair"
            >
              <LogOut size={16} />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {showCreate && (
        <DevModal onSave={onCreateDev} onClose={() => setShowCreate(false)} showAuth />
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
