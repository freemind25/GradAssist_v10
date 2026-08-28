"use client";

import { useState, useEffect, useCallback } from "react";
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  getGoogleDriveStatus,
  saveToGoogleDrive,
  loadFromGoogleDrive,
  type GoogleDriveStatus,
} from "@/lib/google-drive-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GoogleDriveSyncProps {
  onDataLoaded?: (data: any) => void;
  onGetData?: () => any;
  compact?: boolean;
}

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function GoogleDriveSync({ onDataLoaded, onGetData, compact = false }: GoogleDriveSyncProps) {
  const [status, setStatus] = useState<GoogleDriveStatus>({ connected: false, configured: true });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setStatus(getGoogleDriveStatus());
  }, []);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const newStatus = await connectGoogleDrive();
      setStatus(newStatus);
      toast({
        title: "✅ Google Drive connecté",
        description: newStatus.userEmail ? `Connecté en tant que ${newStatus.userEmail}` : "Connexion réussie.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "🔒 Erreur de connexion",
        description: error.message || "Connexion annulée.",
        duration: 12000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const handleDisconnect = useCallback(() => {
    disconnectGoogleDrive();
    setStatus({ connected: false, configured: true });
    toast({ title: "Google Drive déconnecté" });
  }, [toast]);

  const handleSync = useCallback(async () => {
    if (!onGetData) return;
    setIsSyncing(true);
    try {
      const result = await saveToGoogleDrive(onGetData());
      toast({ title: result.success ? "✅ Sauvegardé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [onGetData, toast]);

  const handleLoad = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await loadFromGoogleDrive();
      if (result.success && result.data) onDataLoaded?.(result.data);
      toast({ title: result.success ? "✅ Chargé" : "Erreur", description: result.message, variant: result.success ? "default" : "destructive" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    } finally {
      setIsSyncing(false);
    }
  }, [onDataLoaded, toast]);

  const handleSwitch = useCallback(async () => {
    disconnectGoogleDrive();
    setIsConnecting(true);
    try {
      const newStatus = await connectGoogleDrive();
      setStatus(newStatus);
      toast({ title: "✅ Compte changé", description: newStatus.userEmail || "Nouveau compte connecté." });
    } catch (error: any) {
      setStatus({ connected: false, configured: true });
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Connexion annulée." });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  // ─── Help Modal ───
  if (showHelp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoogleIcon className="h-6 w-6" />
              <h3 className="text-white font-semibold">Google Drive — Diagnostic</h3>
            </div>
            <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white p-1">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-5 space-y-4 text-sm text-white/70">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-300 font-medium">🔒 L&apos;accès est bloqué ?</p>
              <p className="text-red-200/70 text-xs mt-1">C&apos;est un problème de configuration Google Cloud Console, pas de l&apos;application.</p>
            </div>
            <div className="space-y-2">
              <p className="text-white font-medium">Vérifiez ces 3 points :</p>
              <div className="space-y-1.5 text-xs">
                <p>1. Allez sur <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Écran de consentement</a></p>
                <p className="pl-4">→ Si le statut est « Testing », passez en <strong className="text-white">« En production »</strong></p>
                <p className="pl-4">→ Ou ajoutez votre email (<code className="bg-slate-800 px-1 rounded text-blue-300">prenom.nom@univ-constantine3.dz</code>) comme <strong className="text-white">testeur</strong></p>

                <p>2. Allez sur <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Bibliothèque d&apos;APIs</a></p>
                <p className="pl-4">→ Activez <strong className="text-white">Google Drive API</strong></p>

                <p>3. Allez sur <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener" className="text-blue-400 hover:underline">Identifiants</a></p>
                <p className="pl-4">→ Vérifiez que l&apos;ID client OAuth est de type <strong className="text-white">« Application Web »</strong></p>
                <p className="pl-4">→ Origines autorisées : <code className="bg-slate-800 px-1 rounded text-blue-300 text-[10px]">https://VOTRE-URL-APP</code></p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
            <button onClick={() => setShowHelp(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">Fermer</button>
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
          onClick={handleConnect}
          disabled={isConnecting}
          className={cn(
            "flex items-center gap-1.5 transition-colors rounded-lg",
            compact ? "px-2 py-1 text-sm" : "px-3 py-1.5 text-sm",
            isConnecting ? "text-white/40" : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          title="Se connecter à Google Drive"
        >
          <GoogleIcon className={cn("h-4 w-4", isConnecting && "animate-spin")} />
          {!compact && <span className="hidden sm:inline">Google</span>}
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          title="Aide Google Drive"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    );
  }

  // ─── Connected ───
  return (
    <div className={cn("flex items-center gap-0.5", compact ? "" : "")}>
      <button
        onClick={handleSwitch}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-emerald-500/10 border-emerald-500/20 hover:bg-amber-500/20 hover:border-amber-500/30 cursor-pointer transition-all"
        title={`${status.userEmail || "Google Drive"} — Cliquez pour changer de compte`}
      >
        <GoogleIcon className="h-3.5 w-3.5" />
        <span className="text-xs text-emerald-300 hidden sm:inline max-w-[120px] truncate">
          {status.userEmail || "Drive"}
        </span>
      </button>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        title="Envoyer vers Google Drive"
      >
        <svg className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      <button
        onClick={handleDisconnect}
        className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        title="Déconnecter"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
