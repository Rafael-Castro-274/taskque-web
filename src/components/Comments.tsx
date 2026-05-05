import { useState, useEffect, useRef } from "react";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSocket } from "../socket";
import { useAuth } from "../contexts/AuthContext";
import type { Comment } from "../types";

interface Props {
  taskId: string;
}

export function Comments({ taskId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.emit("comment:list", taskId);

    const handleListed = (data: { taskId: string; comments: Comment[] }) => {
      if (data.taskId === taskId) {
        setComments(data.comments);
        setLoading(false);
      }
    };

    const handleCreated = (comment: Comment) => {
      if (comment.taskId === taskId) {
        setComments((prev) => [...prev, comment]);
      }
    };

    const handleDeleted = (data: { id: string; taskId: string }) => {
      if (data.taskId === taskId) {
        setComments((prev) => prev.filter((c) => c.id !== data.id));
      }
    };

    socket.on("comment:listed", handleListed);
    socket.on("comment:created", handleCreated);
    socket.on("comment:deleted", handleDeleted);

    return () => {
      socket.off("comment:listed", handleListed);
      socket.off("comment:created", handleCreated);
      socket.off("comment:deleted", handleDeleted);
    };
  }, [taskId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !token) return;

    const socket = getSocket(token);
    socket.emit("comment:create", { taskId, content: text.trim() });
    setText("");
  };

  const handleDelete = (id: string) => {
    if (!token) return;
    const socket = getSocket(token);
    socket.emit("comment:delete", id);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("pt-BR");
  };

  return (
    <div className="flex min-h-[300px] flex-col">
      <div className="flex items-center gap-2 pb-3 text-sm font-medium text-muted-foreground">
        <MessageSquare size={15} />
        <span>Comentários ({comments.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-1">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum comentário</p>
        ) : (
          comments.map((comment) => (
            <div className="flex gap-2.5" key={comment.id}>
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold text-white"
                style={{ backgroundColor: comment.authorColor }}
              >
                {comment.authorAvatar}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{comment.authorName}</span>
                  <span className="text-[0.65rem] text-muted-foreground">{formatTime(comment.createdAt)}</span>
                  {(comment.authorId === user?.id || user?.role === "admin") && (
                    <button
                      className="ml-auto opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={() => handleDelete(comment.id)}
                      style={{ opacity: undefined }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed break-words">{comment.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="mt-auto flex items-center gap-2 border-t border-border pt-3" onSubmit={handleSubmit}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
          className="h-8 text-xs bg-secondary/30"
        />
        <Button type="submit" size="icon-xs" disabled={!text.trim()} className="shrink-0">
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
