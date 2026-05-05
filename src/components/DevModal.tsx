import { useState } from "react";
import { Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { User } from "../types";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#ef4444", "#22c55e"];

interface Props {
  developer?: User;
  showAuth?: boolean;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}

export function DevModal({ developer, showAuth, onSave, onClose }: Props) {
  const [name, setName] = useState(developer?.name || "");
  const [email, setEmail] = useState(developer?.email || "");
  const [avatar, setAvatar] = useState(developer?.avatar || "");
  const [color, setColor] = useState(developer?.color || COLORS[0]);
  const [role, setRole] = useState<"admin" | "member">(developer?.role || "member");

  const isCreating = !developer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isCreating && showAuth && !email.trim()) return;

    const data: Record<string, string> = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().slice(0, 2).toUpperCase(),
      color,
      role,
    };

    if (showAuth && isCreating) {
      data.email = email.trim();
    }

    onSave(data);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{developer ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do usuário" autoFocus />
          </div>

          {showAuth && isCreating && (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Papel</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "member")}
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/30 px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Mail size={14} className="shrink-0 mt-0.5 text-primary" />
                <span>Uma senha temporária será gerada e enviada por email. O usuário deverá alterá-la no primeiro acesso.</span>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Iniciais do Avatar</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="Ex: JS" maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "h-[30px] w-[30px] rounded-full transition-all",
                    color === c ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background glow-sm" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isCreating && showAuth ? "Criar e Enviar Email" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
