import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "../contexts/AuthContext";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#ef4444", "#22c55e"];

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [color, setColor] = useState(user?.color || COLORS[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password && password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password && password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      return;
    }

    setSaving(true);
    const data: Record<string, string> = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().slice(0, 2).toUpperCase(),
      color,
    };
    if (password) data.password = password;

    const result = await updateProfile(data);
    setSaving(false);

    if (result) {
      setSaved(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError("Erro ao salvar perfil");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[480px] border-border/30 bg-card/80 backdrop-blur-xl glow-md">
        <CardHeader className="flex-row items-center gap-3 pb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-semibold">Meu Perfil</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar section */}
          <div className="flex items-center gap-4">
            <span
              className="inline-flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {avatar || name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <h3 className="font-semibold">{user.name}</h3>
              <span className="text-xs text-muted-foreground">{user.email}</span>
              <div className="mt-1">
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[0.6rem]">
                  {user.role === "admin" ? "Administrador" : "Membro"}
                </Badge>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Iniciais do Avatar</Label>
              <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} maxLength={2} />
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

            <Separator />

            <h3 className="text-sm font-semibold">Alterar Senha</h3>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe vazio para manter"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
