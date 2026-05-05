import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Developer } from "../types";
import { DevModal } from "./DevModal";

interface Props {
  developers: Developer[];
  onCreateDev: (data: Omit<Developer, "id" | "createdAt">) => void;
  onUpdateDev: (id: string, data: Partial<Developer>) => void;
  onDeleteDev: (id: string) => void;
}

export function DevPanel({ developers, onCreateDev, onUpdateDev, onDeleteDev }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingDev, setEditingDev] = useState<Developer | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Users size={18} /> Desenvolvedores
          <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">{developers.length}</Badge>
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>
      <div className="space-y-1">
        {developers.map((dev) => (
          <div className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-secondary/20" key={dev.id}>
            <span
              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: dev.color }}
            >
              {dev.avatar}
            </span>
            <span className="flex-1 text-sm font-medium">{dev.name}</span>
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button variant="ghost" size="icon-xs" onClick={() => setEditingDev(dev)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => onDeleteDev(dev.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {developers.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum dev cadastrado</p>
        )}
      </div>

      {showCreate && (
        <DevModal
          onSave={onCreateDev as unknown as (data: Record<string, string>) => void}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editingDev && (
        <DevModal
          developer={editingDev}
          onSave={(data) => onUpdateDev(editingDev.id, data)}
          onClose={() => setEditingDev(null)}
        />
      )}
    </div>
  );
}
