import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Sprint } from "../types";

interface Props {
  sprint?: Sprint;
  onSave: (data: { name: string; goal: string; startDate: string; endDate: string }) => void;
  onClose: () => void;
}

export function SprintModal({ sprint, onSave, onClose }: Props) {
  const [name, setName] = useState(sprint?.name || "");
  const [goal, setGoal] = useState(sprint?.goal || "");
  const [startDate, setStartDate] = useState(sprint?.startDate || "");
  const [endDate, setEndDate] = useState(sprint?.endDate || "");

  const isEditing = !!sprint;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    onSave({
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Sprint" : "Nova Sprint"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sprint 1, Sprint Jan/2026..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Objetivo</Label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Descreva o objetivo desta sprint..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEditing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
