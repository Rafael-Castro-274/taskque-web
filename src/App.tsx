import { useState, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useStore } from "./contexts/StoreContext";
import { useTheme } from "./hooks/useTheme";
import { Board } from "./components/Board";
import { ListView } from "./components/ListView";
import { TvPanel } from "./components/TvPanel";
import { Sidebar } from "./components/Sidebar";
import { Wifi, WifiOff } from "lucide-react";
import { disconnectSocket } from "./socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

type ViewMode = "board" | "list" | "tv";

const VIEW_LABELS: Record<ViewMode, string> = {
  board: "Board",
  list: "Lista",
  tv: "Painel TV",
};

function App() {
  const [view, setView] = useState<ViewMode>("board");
  const { theme, toggleTheme } = useTheme();
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

  if (!user) return null;

  if (view === "tv") {
    return (
      <div className="app">
        <div className="layout">
          <Sidebar
            currentUser={user}
            developers={developers}
            view={view}
            theme={theme}
            onViewChange={setView}
            onToggleTheme={toggleTheme}
            onCreateDev={createDeveloper}
            onUpdateDev={updateDeveloper}
            onDeleteDev={deleteDeveloper}
            onToggleActive={toggleActive}
            onLogout={handleLogout}
          />
          <div className="content tv-content">
            <TvPanel tasks={tasks} developers={developers} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="layout">
        <Sidebar
          currentUser={user}
          developers={developers}
          view={view}
          theme={theme}
          onViewChange={setView}
          onToggleTheme={toggleTheme}
          onCreateDev={createDeveloper}
          onUpdateDev={updateDeveloper}
          onDeleteDev={deleteDeveloper}
          onToggleActive={toggleActive}
          onLogout={handleLogout}
        />
        <div className="content">
          <header className="header">
            <div className="header-left">
              <h2 className="page-title">{VIEW_LABELS[view]}</h2>
              <span className="task-count">{tasks.length} tarefas</span>
            </div>
            <div className={`connection-status ${connected ? "online" : "offline"}`}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {connected ? "Conectado" : "Desconectado"}
            </div>
          </header>
          <main className="main">
            {view === "board" ? (
              <Board
                tasks={tasks}
                developers={developers}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onMoveTask={moveTask}
                onDeleteTask={deleteTask}
              />
            ) : (
              <ListView
                tasks={tasks}
                developers={developers}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onMoveTask={moveTask}
                onDeleteTask={deleteTask}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
