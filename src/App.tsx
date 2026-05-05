import { useState, useCallback, useMemo } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useStore } from "./contexts/StoreContext";
import { Board } from "./components/Board";
import { ListView } from "./components/ListView";
import { TvPanel } from "./components/TvPanel";
import { Sidebar } from "./components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Search, X, Zap } from "lucide-react";
import { disconnectSocket, API_URL as SOCKET_API_URL } from "./socket";

const API_URL = SOCKET_API_URL;

type ViewMode = "board" | "list" | "tv";

const VIEW_LABELS: Record<ViewMode, string> = {
  board: "Board",
  list: "Lista",
  tv: "Painel TV",
};

function App() {
  const [view, setView] = useState<ViewMode>("board");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, token, logout } = useAuth();
  const {
    developers,
    tasks,
    connected,
    createDeveloper,
    updateDeveloper,
    deleteDeveloper,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    githubConfigured,
    projects,
    sprints,
    selectedSprintId,
    setSelectedSprintId,
    createSprint,
    updateSprint,
    deleteSprint,
    completeSprint,
  } = useStore();

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  const toggleActive = useCallback(async (id: string) => {
    if (!token) return;
    await fetch(`${API_URL}/api/users/${id}/toggle-active`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const handleCreateProject = useCallback(async (data: { name: string; githubOwner: string; githubRepo: string; defaultBranch: string }) => {
    if (!token) return;
    await fetch(`${API_URL}/api/projects`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, [token]);

  const handleUpdateProject = useCallback(async (id: string, data: { name: string; githubOwner: string; githubRepo: string; defaultBranch: string }) => {
    if (!token) return;
    await fetch(`${API_URL}/api/projects/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }, [token]);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!token) return;
    await fetch(`${API_URL}/api/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [token]);

  const sprintFilteredTasks = useMemo(() => {
    if (!selectedSprintId) return tasks;
    if (selectedSprintId === "backlog") return tasks.filter((t) => !t.sprintId);
    return tasks.filter((t) => t.sprintId === selectedSprintId);
  }, [tasks, selectedSprintId]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sprintFilteredTasks;
    return sprintFilteredTasks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.branches?.some((b) => b.branchName.toLowerCase().includes(q))
    );
  }, [sprintFilteredTasks, searchQuery]);

  const sortedSprints = useMemo(() => {
    const order = { active: 0, planning: 1, completed: 2 };
    return [...sprints].sort((a, b) => order[a.status] - order[b.status]);
  }, [sprints]);

  if (!user) return null;

  if (view === "tv") {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentUser={user}
            developers={developers}
            projects={projects}
            githubConfigured={githubConfigured}
            view={view}
            onViewChange={setView}
            onCreateDev={createDeveloper}
            onUpdateDev={updateDeveloper}
            onDeleteDev={deleteDeveloper}
            onToggleActive={toggleActive}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onLogout={handleLogout}
            sprints={sprints}
            tasks={tasks}
            selectedSprintId={selectedSprintId}
            onSelectSprint={setSelectedSprintId}
            onCreateSprint={createSprint}
            onUpdateSprint={updateSprint}
            onDeleteSprint={deleteSprint}
            onCompleteSprint={completeSprint}
          />
          <div className="flex-1 overflow-y-auto">
            <TvPanel tasks={tasks} developers={developers} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentUser={user}
          developers={developers}
          projects={projects}
          githubConfigured={githubConfigured}
          view={view}
          onViewChange={setView}
          onCreateDev={createDeveloper}
          onUpdateDev={updateDeveloper}
          onDeleteDev={deleteDeveloper}
          onToggleActive={toggleActive}
          onCreateProject={handleCreateProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onLogout={handleLogout}
          sprints={sprints}
          tasks={tasks}
          selectedSprintId={selectedSprintId}
          onSelectSprint={setSelectedSprintId}
          onCreateSprint={createSprint}
          onUpdateSprint={updateSprint}
          onDeleteSprint={deleteSprint}
          onCompleteSprint={completeSprint}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 border-b border-border/30 bg-background/80 px-5 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold">{VIEW_LABELS[view]}</h2>
              <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">
                {filteredTasks.length} tarefas
              </Badge>
            </div>

            {/* Sprint selector */}
            <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-secondary/20 px-2.5 py-1">
              <Zap size={13} className="text-primary" />
              <select
                className="bg-transparent text-xs text-foreground outline-none"
                value={selectedSprintId || ""}
                onChange={(e) => setSelectedSprintId(e.target.value || null)}
              >
                <option value="">Todas as tarefas</option>
                <option value="backlog">Backlog (sem sprint)</option>
                {sortedSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.status === "active" ? "● " : ""}{s.name}
                    {s.status === "completed" ? " (concluída)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-shrink flex-grow-0 basis-[340px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 pr-8 text-xs bg-secondary/20 border-border/30"
                type="text"
                placeholder="Buscar por título, descrição ou branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Connection status */}
            <Badge
              variant={connected ? "outline" : "destructive"}
              className={cn(
                "gap-1.5 text-[0.6rem]",
                connected && "border-primary/30 text-primary glow-sm"
              )}
            >
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? "Conectado" : "Desconectado"}
            </Badge>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4">
            {view === "board" ? (
              <Board
                tasks={filteredTasks}
                developers={developers}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onMoveTask={moveTask}
                onDeleteTask={deleteTask}
                githubConfigured={githubConfigured}
                projects={projects}
                sprints={sprints}
                selectedSprintId={selectedSprintId}
              />
            ) : (
              <ListView
                tasks={filteredTasks}
                developers={developers}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onMoveTask={moveTask}
                onDeleteTask={deleteTask}
                githubConfigured={githubConfigured}
                projects={projects}
                sprints={sprints}
                selectedSprintId={selectedSprintId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
