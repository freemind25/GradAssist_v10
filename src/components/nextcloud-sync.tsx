"use client";

import { useState, useEffect, useCallback } from "react";
import {
  connectNextcloud,
  disconnectNextcloud,
  getNextcloudStatus,
  saveToNextcloud,
  loadFromNextcloud,
  listNextcloudBackups,
  loadNextcloudBackup,
  type NextcloudStatus,
} from "@/lib/nextcloud-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NextcloudSyncProps {
  onDataLoaded?: (data: any) => void;
  onGetData?: () => any;
  compact?: boolean;
}

const CloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

export function NextcloudSync({ onDataLoaded, onGetData, compact = false }: NextcloudSyncProps) {
  const [status, setStatus] = useState<NextcloudStatus>({ connected: false, configured: false });
  const [showPanel, setShowPanel] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<{ name: string; date: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setStatus(getNextcloudStatus());
  }, []);

  const handleConnect = useCallback(async () => {
    if (!serverUrl || !username || !password) {
      toast({ variant: "destructive", title: "Champs requis", description: "Remplissez tous les champs." });
      return;
    }
    setIsConnecting(true);
    try {
      const newStatus = await connectNextcloud(serverUrl, username, password);
      setStatus(newStatus);
      setShowLogin(false);
      toast({
        title: "✅ Nextcloud connecté",
        description: `${username}@${newStatus.serverUrl}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "🔒 Erreur de connexion",
        description: error.message || "Connexion échouée.",
        duration: 12000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [serverUrl, username, password, toast]);

  const handleDisconnect = useCallback(() => {
    disconnectNextcloud();
    setStatus({ connected: false, configured: false });
    setShowPanel(false);
    toast({ title: "Nextcloud déconnecté" });
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (!onGetData) return;
    setIsSyncing(true);
    try {
      const result = await saveToNextcloud(onGetData());
      toast({
        title: result.success ? "✅ Sauvegardé" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [onGetData, toast]);

  const handleLoad = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await loadFromNextcloud();
      if (result.success && result.data) onDataLoaded?.(result.data);
      toast({
        title: result.success ? "✅ Chargé" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [onDataLoaded, toast]);

  const handleLoadBackup = useCallback(async (backupName: string) => {
    setIsSyncing(true);
    try {
      const result = await loadNextcloudBackup(backupName);
      if (result.success && result.data) onDataLoaded?.(result.data);
      toast({
        title: result.success ? "✅ Backup chargé" : "Erreur",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      setShowBackups(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [onDataLoaded, toast]);

  const handleShowBackups = useCallback(async () => {
    setShowBackups(true);
    const list = await listNextcloudBackups();
    setBackups(list);
  }, []);

  // ─── Login Panel ───
  if (showLogin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudIcon className="h-6 w-6 text-sky-400" />
              <h3 className="text-white font-semibold">Connexion Nextcloud</h3>
            </div>
            <button onClick={() => setShowLogin(false)} className="text-white/40 hover:text-white p-1">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">URL du serveur Nextcloud</label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://cloud.univ-constantine3.dz"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Nom d&apos;utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="m.sadi"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Mot de passe (ou mot de passe d&apos;application)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-200/80">
              <p className="font-medium text-sky-300 mb-1">💡 Mot de passe d&apos;application</p>
              <p>Dans Nextcloud : Paramètres → Sécurité → Ajouter un mot de passe d&apos;application → nommez-le &quot;GradeAssist&quot;.</p>
              <p className="mt-1">Ce mot de passe est plus sûr que votre mot de passe principal.</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-2">
            <button
              onClick={() => setShowLogin(false)}
              className="px-4 py-2 text-sm text-white/60 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting || !serverUrl || !username || !password}
              className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 disabled:bg-sky-600/50 text-white rounded-lg transition-colors"
            >
              {isConnecting ? "Connexion..." : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Backups Panel ───
  if (showBackups) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Backups Nextcloud</h3>
            <button onClick={() => setShowBackups(false)} className="text-white/40 hover:text-white p-1">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 max-h-80 overflow-y-auto">
            {backups.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-4">Aucun backup trouvé</p>
            ) : (
              <div className="space-y-2">
                {backups.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => handleLoadBackup(b.name)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-white/80 hover:text-white transition-colors"
                  >
                    <span>📦 {b.name}</span>
                    <span className="text-white/40 text-xs">{b.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
            <button onClick={() => setShowBackups(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not connected ───
  if (!status.connected) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowLogin(true)}
          className={cn(
            "flex items-center gap-1.5 transition-colors rounded-lg",
            compact ? "px-2 py-1 text-sm" : "px-3 py-1.5 text-sm",
            "text-white/70 hover:text-white hover:bg-white/10"
          )}
          title="Se connecter à Nextcloud"
        >
          <CloudIcon className="h-4 w-4 text-sky-400" />
          {!compact && <span className="hidden sm:inline">Nextcloud</span>}
        </button>
      </div>
    );
  }

  // ─── Connected ───
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 cursor-pointer transition-all"
        title={`${status.username}@${status.serverUrl}`}
      >
        <CloudIcon className="h-3.5 w-3.5 text-sky-400" />
        <span className="text-xs text-sky-300 hidden sm:inline max-w-[120px] truncate">
          {status.username || "Nextcloud"}
        </span>
      </button>
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 min-w-[200px]">
          <div className="text-xs text-white/50 mb-2 truncate">
            {status.username}@{status.serverUrl}
          </div>
          <div className="space-y-1">
            <button
              onClick={handleSave}
              disabled={isSyncing}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className={cn("h-4 w-4", isSyncing && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Sauvegarder
            </button>
            <button
              onClick={handleLoad}
              disabled={isSyncing}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className={cn("h-4 w-4", isSyncing && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Charger
            </button>
            <button
              onClick={handleShowBackups}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Backups
            </button>
            <hr className="border-slate-700 my-1" />
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
