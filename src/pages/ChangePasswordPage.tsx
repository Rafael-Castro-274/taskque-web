import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "../contexts/AuthContext";

export function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateProfile, user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Digite a nova senha");
      return;
    }
    if (password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const result = await updateProfile({ password });
    setLoading(false);

    if (result) {
      setUser({ ...result, mustChangePassword: false });
      navigate("/");
    } else {
      setError("Erro ao alterar senha. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-[420px] border-border/30 bg-card/80 backdrop-blur-xl glow-md">
        <CardHeader className="items-center space-y-3 pb-2">
          <img src="/logo.png" alt="TaskQue" className="h-[100px] object-contain" />
          <p className="text-sm text-muted-foreground">
            Olá {user?.name}, defina sua nova senha para continuar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Lock size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>Esta é uma senha temporária. Você precisa criar uma nova senha antes de continuar.</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua nova senha"
                autoFocus
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
            <Button type="submit" className="w-full" disabled={loading}>
              <Lock size={16} />
              {loading ? "Salvando..." : "Definir Nova Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
