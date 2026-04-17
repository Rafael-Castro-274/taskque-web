import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
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

  // Fetch repos on mount (new project only)
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

  // Fetch branches when repo changes
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Editar Projeto" : "Novo Projeto"}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {!isEditing && (
            <div className="form-group">
              <label>Repositório GitHub</label>
              {loadingRepos ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: "var(--text-secondary)" }}>
                  <Loader2 size={16} className="spin" />
                  <span>Carregando repositórios...</span>
                </div>
              ) : repoError ? (
                <div style={{ color: "var(--danger)", fontSize: 13 }}>{repoError}</div>
              ) : (
                <select
                  value={selectedFullName}
                  onChange={(e) => handleRepoSelect(e.target.value)}
                  style={{ width: "100%" }}
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

          <div className="form-group">
            <label>Nome do Projeto</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Frontend, Backend, API..."
              autoFocus={isEditing}
            />
          </div>

          {/* Branch select - shown when repo is selected (new) or always (edit) */}
          {(selectedFullName || isEditing) && (
            <div className="form-group">
              <label>Branch Base</label>
              {loadingBranches ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", color: "var(--text-secondary)" }}>
                  <Loader2 size={16} className="spin" />
                  <span>Carregando branches...</span>
                </div>
              ) : branches.length > 0 ? (
                <select
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  style={{ width: "100%" }}
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                />
              )}
            </div>
          )}

          {isEditing && (
            <div className="form-row">
              <div className="form-group">
                <label>GitHub Owner</label>
                <input
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="usuário ou organização"
                />
              </div>
              <div className="form-group">
                <label>GitHub Repo</label>
                <input
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="nome do repositório"
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
