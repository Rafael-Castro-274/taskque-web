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
} from "lucide-react";
import type { User } from "../types";
import { DevModal } from "./DevModal";

type ViewMode = "board" | "list" | "tv";
type Theme = "dark" | "light";

interface Props {
  currentUser: User;
  developers: User[];
  view: ViewMode;
  theme: Theme;
  onViewChange: (view: ViewMode) => void;
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCreateDev: (data: Omit<User, "id" | "createdAt">) => void;
  onUpdateDev: (id: string, data: Partial<User>) => void;
  onDeleteDev: (id: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  currentUser,
  developers,
  view,
  theme,
  onViewChange,
  onToggleTheme,
  onCreateDev,
  onUpdateDev,
  onDeleteDev,
  onLogout,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [usersOpen, setUsersOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDev, setEditingDev] = useState<User | null>(null);
  const navigate = useNavigate();
  const isAdmin = currentUser.role === "admin";

  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {!collapsed && <h1 className="sidebar-logo">TaskQue</h1>}
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
                    <div className="user-item" key={dev.id}>
                      <span className="avatar-sm" style={{ backgroundColor: dev.color }}>
                        {dev.avatar}
                      </span>
                      <span className="user-name">{dev.name}</span>
                      {isAdmin && (
                        <div className="user-actions">
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
    </>
  );
}
