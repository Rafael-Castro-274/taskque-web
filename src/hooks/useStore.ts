import { useCallback, useEffect, useState, useRef } from "react";
import { getSocket, disconnectSocket } from "../socket";
import type { User, Task } from "../types";
import type { Socket } from "socket.io-client";

export function useStore(token: string | null) {
  const [developers, setDevelopers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("init", (data: { developers: User[]; tasks: Task[] }) => {
      setDevelopers(data.developers);
      setTasks(data.tasks);
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

    // Backward compat for init
    socket.on("developer:created", (user: User) => {
      setDevelopers((prev) => [...prev, user]);
    });
    socket.on("developer:updated", (user: User) => {
      setDevelopers((prev) => prev.map((d) => (d.id === user.id ? user : d)));
    });
    socket.on("developer:deleted", (id: string) => {
      setDevelopers((prev) => prev.filter((d) => d.id !== id));
    });

    // Task events
    socket.on("task:created", (task: Task) => {
      setTasks((prev) => [...prev, task]);
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

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("init");
      socket.off("user:created");
      socket.off("user:updated");
      socket.off("user:deleted");
      socket.off("developer:created");
      socket.off("developer:updated");
      socket.off("developer:deleted");
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("tasks:sync");
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

  const createTask = useCallback((data: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    emit("task:create", data);
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

  return {
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
  };
}
