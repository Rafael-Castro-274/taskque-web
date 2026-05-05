import { createContext, useContext, useCallback, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { getSocket, disconnectSocket, API_URL } from "../socket";
import { useAuth } from "./AuthContext";
import type { User, Task, Project, Subtask, Sprint } from "../types";
import type { Socket } from "socket.io-client";

interface StoreContextValue {
  developers: User[];
  tasks: Task[];
  projects: Project[];
  sprints: Sprint[];
  selectedSprintId: string | null;
  setSelectedSprintId: (id: string | null) => void;
  connected: boolean;
  githubConfigured: boolean;
  createDeveloper: (data: Omit<User, "id" | "createdAt">) => void;
  updateDeveloper: (id: string, data: Partial<User>) => void;
  deleteDeveloper: (id: string) => void;
  createTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[]; subtaskTitles?: string[] }) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  moveTask: (id: string, status: Task["status"]) => void;
  deleteTask: (id: string) => void;
  createSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (id: string) => void;
  deleteSubtask: (id: string) => void;
  createSprint: (data: { name: string; goal?: string; startDate: string; endDate: string }) => void;
  updateSprint: (id: string, data: Partial<Pick<Sprint, "name" | "goal" | "startDate" | "endDate" | "status">>) => void;
  deleteSprint: (id: string) => void;
  completeSprint: (id: string, moves: { taskId: string; target: string | null }[]) => void;
}

const StoreContext = createContext<StoreContextValue>(null!);

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [developers, setDevelopers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintIdState] = useState<string | null>(
    () => localStorage.getItem("taskque:selectedSprintId")
  );
  const [connected, setConnected] = useState(false);
  const [githubConfigured, setGithubConfigured] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pendingSubtasksRef = useRef<string[]>([]);

  const setSelectedSprintId = useCallback((id: string | null) => {
    setSelectedSprintIdState(id);
    if (id) localStorage.setItem("taskque:selectedSprintId", id);
    else localStorage.removeItem("taskque:selectedSprintId");
  }, []);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    // Check GitHub integration status
    fetch(`${API_URL}/api/github/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setGithubConfigured(data.configured))
      .catch(() => setGithubConfigured(false));

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("init", (data: { developers: User[]; tasks: Task[]; projects: Project[]; sprints: Sprint[] }) => {
      setDevelopers(data.developers);
      setTasks(data.tasks);
      setProjects(data.projects || []);
      const sprintsData = data.sprints || [];
      setSprints(sprintsData);
      // Auto-select active sprint if none selected
      const stored = localStorage.getItem("taskque:selectedSprintId");
      if (!stored || !sprintsData.find((s) => s.id === stored)) {
        const active = sprintsData.find((s) => s.status === "active");
        if (active) {
          setSelectedSprintIdState(active.id);
          localStorage.setItem("taskque:selectedSprintId", active.id);
        }
      }
    });

    // User events
    socket.on("user:created", (user: User) => {
      setDevelopers((prev) => [...prev, user]);
    });
    socket.on("user:updated", (user: User) => {
      setDevelopers((prev) => prev.map((d) => (d.id === user.id ? user : d)));
    });
    socket.on("user:deleted", (id: string) => {
      setDevelopers((prev) => prev.filter((d) => d.id !== id));
    });

    // Task events
    socket.on("task:created", (task: Task) => {
      setTasks((prev) => [...prev, task]);
      // Create pending subtasks if any were queued during task creation
      const titles = pendingSubtasksRef.current;
      if (titles.length > 0) {
        pendingSubtasksRef.current = [];
        for (const t of titles) {
          socket.emit("subtask:create", { taskId: task.id, title: t });
        }
      }
    });
    socket.on("task:updated", (task: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    });
    socket.on("task:deleted", (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
    socket.on("tasks:sync", (allTasks: Task[]) => {
      setTasks(allTasks);
    });

    // Subtask events
    socket.on("subtask:created", (subtask: Subtask) => {
      setTasks((prev) => prev.map((t) =>
        t.id === subtask.taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t
      ));
    });
    socket.on("subtask:toggled", (subtask: Subtask) => {
      setTasks((prev) => prev.map((t) =>
        t.id === subtask.taskId
          ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtask.id ? subtask : s)) }
          : t
      ));
    });
    socket.on("subtask:deleted", ({ id, taskId }: { id: string; taskId: string }) => {
      setTasks((prev) => prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== id) } : t
      ));
    });

    // Project events
    socket.on("project:created", (project: Project) => {
      setProjects((prev) => [...prev, project]);
    });
    socket.on("project:updated", (project: Project) => {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    });
    socket.on("project:deleted", (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    });

    // Sprint events
    socket.on("sprint:created", (sprint: Sprint) => {
      setSprints((prev) => [sprint, ...prev]);
    });
    socket.on("sprint:updated", (sprint: Sprint) => {
      setSprints((prev) => prev.map((s) => (s.id === sprint.id ? sprint : s)));
    });
    socket.on("sprint:deleted", (id: string) => {
      setSprints((prev) => prev.filter((s) => s.id !== id));
      setSelectedSprintIdState((prev) => (prev === id ? null : prev));
    });
    socket.on("sprint:error", (data: { error: string }) => {
      alert(data.error);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("init");
      socket.off("user:created");
      socket.off("user:updated");
      socket.off("user:deleted");
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("tasks:sync");
      socket.off("project:created");
      socket.off("project:updated");
      socket.off("project:deleted");
      socket.off("subtask:created");
      socket.off("subtask:toggled");
      socket.off("subtask:deleted");
      socket.off("sprint:created");
      socket.off("sprint:updated");
      socket.off("sprint:deleted");
      socket.off("sprint:error");
    };
  }, [token]);

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const createDeveloper = useCallback((data: Omit<User, "id" | "createdAt">) => {
    emit("user:create", data);
  }, [emit]);

  const updateDeveloper = useCallback((id: string, data: Partial<User>) => {
    emit("user:update", { id, data });
  }, [emit]);

  const deleteDeveloper = useCallback((id: string) => {
    emit("user:delete", id);
  }, [emit]);

  const createTask = useCallback((data: Omit<Task, "id" | "createdAt" | "updatedAt" | "branches" | "subtasks"> & { branchProjectIds?: string[]; subtaskTitles?: string[] }) => {
    const { subtaskTitles, ...taskData } = data;
    if (subtaskTitles && subtaskTitles.length > 0) {
      pendingSubtasksRef.current = subtaskTitles;
    }
    emit("task:create", taskData);
  }, [emit]);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    emit("task:update", { id, data });
  }, [emit]);

  const moveTask = useCallback((id: string, status: Task["status"]) => {
    emit("task:move", { id, status });
  }, [emit]);

  const deleteTask = useCallback((id: string) => {
    emit("task:delete", id);
  }, [emit]);

  const createSubtask = useCallback((taskId: string, title: string) => {
    emit("subtask:create", { taskId, title });
  }, [emit]);

  const toggleSubtask = useCallback((id: string) => {
    emit("subtask:toggle", id);
  }, [emit]);

  const deleteSubtask = useCallback((id: string) => {
    emit("subtask:delete", id);
  }, [emit]);

  const createSprint = useCallback((data: { name: string; goal?: string; startDate: string; endDate: string }) => {
    emit("sprint:create", data);
  }, [emit]);

  const updateSprint = useCallback((id: string, data: Partial<Pick<Sprint, "name" | "goal" | "startDate" | "endDate" | "status">>) => {
    emit("sprint:update", { id, data });
  }, [emit]);

  const deleteSprint = useCallback((id: string) => {
    emit("sprint:delete", id);
  }, [emit]);

  const completeSprint = useCallback((id: string, moves: { taskId: string; target: string | null }[]) => {
    emit("sprint:complete", { id, moves });
  }, [emit]);

  return (
    <StoreContext.Provider value={{
      developers, tasks, projects, sprints, selectedSprintId, setSelectedSprintId, connected, githubConfigured,
      createDeveloper, updateDeveloper, deleteDeveloper,
      createTask, updateTask, moveTask, deleteTask,
      createSubtask, toggleSubtask, deleteSubtask,
      createSprint, updateSprint, deleteSprint, completeSprint,
    }}>
      {children}
    </StoreContext.Provider>
  );
}
