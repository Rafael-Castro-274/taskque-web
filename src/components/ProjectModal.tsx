import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../socket";

interface GithubRepo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

interface Props {
  project?: Project;
  onSave: (data: { name: string; githubOwner: string; githubRepo: string; defaultBranch: string }) => void;
  onClose: () => void;
}

export function ProjectModal({ project, onSave, onClose }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState(project?.name || "");
  const [githubOwner, setGithubOwner] = useState(project?.githubOwner || "");
  const [githubRepo, setGithubRepo] = useState(project?.githubRepo || "");
  const [defaultBranch, setDefaultBranch] = useState(project?.defaultBranch || "main");

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState("");

  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    if (isEditing) return;
    setLoadingRepos(true);
    fetch(`${API_URL}/api/github/repos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar repositórios");
        return res.json();
      })
      .then((data: GithubRepo[]) => setRepos(data))
      .catch((err) => setRepoError(err.message))
      .finally(() => setLoadingRepos(false));
  }, [token, isEditing]);

  useEffect(() => {
    if (!githubOwner || !githubRepo) {
      setBranches([]);
      return;
    }
    setLoadingBranches(true);
    fetch(`${API_URL}/api/github/repos/${githubOwner}/${githubRepo}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar branches");
        return res.json();
      })
      .then((data: string[]) => setBranches(data))
      .catch(() => setBranches([]))
      .finally(() => setLoadingBranches(false));
  }, [token, githubOwner, githubRepo]);

  const handleRepoSelect = (fullName: string) => {
    const repo = repos.find((r) => r.fullName === fullName);
    if (repo) {
      setGithubOwner(repo.owner);
      setGithubRepo(repo.name);
      setDefaultBranch(repo.defaultBranch);
      if (!name.trim()) setName(repo.name);
    } else {
      setGithubOwner("");
      setGithubRepo("");
      setDefaultBranch("main");
      setBranches([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !githubOwner.trim() || !githubRepo.trim()) return;
    onSave({
      name: name.trim(),
      githubOwner: githubOwner.trim(),
      githubRepo: githubRepo.trim(),
      defaultBranch: defaultBranch.trim() || "main",
    });
    onClose();
  };

  const selectedFullName = githubOwner && githubRepo ? `${githubOwner}/${githubRepo}` : "";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Repositório GitHub</Label>
              {loadingRepos ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Carregando repositórios...</span>
                </div>
              ) : repoError ? (
                <div className="text-sm text-destructive">{repoError}</div>
              ) : (
                <select
                  value={selectedFullName}
                  onChange={(e) => handleRepoSelect(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/30 px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione um repositório</option>
                  {repos.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName}{r.private ? " 🔒" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Nome do Projeto</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Frontend, Backend, API..."
              autoFocus={isEditing}
            />
          </div>

          {(selectedFullName || isEditing) && (
            <div className="space-y-2">
              <Label>Branch Base</Label>
              {loadingBranches ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Carregando branches...</span>
                </div>
              ) : branches.length > 0 ? (
                <select
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/30 px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                />
              )}
            </div>
          )}

          {isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>GitHub Owner</Label>
                <Input
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="usuário ou organização"
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub Repo</Label>
                <Input
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="nome do repositório"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
