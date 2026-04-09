import { useState, useEffect, useRef } from "react";
import { Send, Trash2, MessageSquare } from "lucide-react";
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

    // Request comments
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
    <div className="comments">
      <div className="comments-header">
        <MessageSquare size={15} />
        <span>Comentários ({comments.length})</span>
      </div>

      <div className="comments-list">
        {loading ? (
          <p className="comments-empty">Carregando...</p>
        ) : comments.length === 0 ? (
          <p className="comments-empty">Nenhum comentário</p>
        ) : (
          comments.map((comment) => (
            <div className="comment" key={comment.id}>
              <span className="comment-avatar" style={{ backgroundColor: comment.authorColor }}>
                {comment.authorAvatar}
              </span>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{comment.authorName}</span>
                  <span className="comment-time">{formatTime(comment.createdAt)}</span>
                  {(comment.authorId === user?.id || user?.role === "admin") && (
                    <button className="comment-delete" onClick={() => handleDelete(comment.id)}>
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva um comentário..."
        />
        <button type="submit" className="comment-send" disabled={!text.trim()}>
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
