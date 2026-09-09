"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  signInWithGoogle,
  disconnectDrive,
  isDriveConnected,
  getStoredEmail,
  type DriveTokenData,
} from "@/lib/google-drive-service";

interface GoogleDriveSyncProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleDriveSync({ onConnectionChange }: GoogleDriveSyncProps) {
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const isConnected = isDriveConnected();
    setConnected(isConnected);
    if (isConnected) {
      setEmail(getStoredEmail());
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const tokenData: DriveTokenData = await signInWithGoogle();
      setConnected(true);
      setEmail(tokenData.email);
      setShowDialog(false);
      onConnectionChange?.(true);
      toast({
        title: "✅ Google Drive connecté",
        description: `Connecté en tant que ${tokenData.email}. Les rapports seront sauvegardés dans votre Drive.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    setConnected(false);
    setEmail(null);
    setShowDialog(false);
    onConnectionChange?.(false);
    toast({
      title: "Google Drive déconnecté",
      description: "L'accès à Google Drive a été révoqué.",
    });
  };

  return (
    <>
      {connected ? (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={`Google Drive connecté (${email})`}
            >
              <Cloud className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline text-emerald-400">Drive</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-emerald-500" />
                Google Drive Connecté
              </DialogTitle>
              <DialogDescription>
                Vos rapports sont sauvegardés automatiquement dans votre Google Drive personnel.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30">
                <Cloud className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{email}</p>
                  <p className="text-xs text-muted-foreground">
                    Dossier GradeAssist créé dans votre Drive
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Fermer
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnecter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Connecter Google Drive"
            >
              <CloudOff className="h-4 w-4" />
              <span className="hidden sm:inline">Drive</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                Connecter Google Drive
              </DialogTitle>
              <DialogDescription>
                Autorisez l&apos;accès à votre Google Drive personnel pour sauvegarder automatiquement vos rapports.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                <h4 className="text-sm font-bold mb-2">Ce que l&apos;application peut faire :</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>Créer et modifier des fichiers dans le dossier <strong>GradeAssist</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>Sauvegarder vos rapports de cours et d&apos;encadrement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">✗</span>
                    <span>Accéder à vos autres fichiers Google Drive</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 Scope <code>drive.file</code> — l&apos;application ne peut acc&apos;der qu&apos;aux fichiers qu&apos;elle crée elle-même.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleConnect}
                disabled={loading || !GOOGLE_CLIENT_ID_AVAILABLE()}
                className="gap-2"
              >
                <Cloud className="h-4 w-4" />
                {loading ? "Connexion..." : "Se connecter avec Google"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function GOOGLE_CLIENT_ID_AVAILABLE(): boolean {
  if (typeof window === "undefined") return false;
  // Check if NEXT_PUBLIC_GOOGLE_CLIENT_ID is set
  // In Next.js, env vars are inlined at build time
  try {
    // The env var should be available at runtime
    return true; // Assume available; the service will throw a clear error if not
  } catch {
    return false;
  }
}
