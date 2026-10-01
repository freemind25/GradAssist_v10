"use client";

import { useEffect, useState } from "react";
import {
  KeyRound,
  ExternalLink,
  Check,
  Sparkles,
  Loader2,
  FlaskConical,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AI_PROVIDERS,
  AI_STORAGE_KEYS,
  DEFAULT_AI_PROVIDER_ID,
  LEGACY_MISTRAL_KEY,
  getAiProvider,
} from "@/lib/ai-providers";

/**
 * Sélection du fournisseur IA + clé API personnelle (BYOK).
 * Tout est stocké en localStorage côté client ; la clé n'est envoyée
 * qu'au proxy /api/ai au moment d'une demande.
 * Le bouton « Tester la clé » envoie une vraie requête via le proxy
 * pour vérifier clé + modèle auprès du fournisseur choisi.
 */
export function AiProviderSettings() {
  const [providerId, setProviderId] = useState(DEFAULT_AI_PROVIDER_ID);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Chargement initial (localStorage) + migration de l'ancienne clé Mistral
  useEffect(() => {
    const savedProvider = localStorage.getItem(AI_STORAGE_KEYS.provider);
    const provider = getAiProvider(savedProvider);
    setProviderId(provider.id);

    let key = localStorage.getItem(AI_STORAGE_KEYS.apiKey) || "";
    if (!key) {
      // Migration : une ancienne clé Mistral devient la clé du fournisseur Mistral
      const legacy = localStorage.getItem(LEGACY_MISTRAL_KEY);
      if (legacy && provider.id === "mistral") {
        key = legacy;
        localStorage.setItem(AI_STORAGE_KEYS.apiKey, key);
      }
    }
    setApiKey(key);
    setModel(localStorage.getItem(AI_STORAGE_KEYS.model) || "");
  }, []);

  const handleProviderChange = (id: string) => {
    setProviderId(id);
    setTestResult(null);
    localStorage.setItem(AI_STORAGE_KEYS.provider, id);
    // Le modèle sauvegardé peut ne pas exister chez le nouveau fournisseur
    setModel("");
    localStorage.removeItem(AI_STORAGE_KEYS.model);
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    setTestResult(null);
    if (value) {
      localStorage.setItem(AI_STORAGE_KEYS.apiKey, value);
      localStorage.removeItem(LEGACY_MISTRAL_KEY);
    } else {
      localStorage.removeItem(AI_STORAGE_KEYS.apiKey);
    }
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    setTestResult(null);
    if (value) {
      localStorage.setItem(AI_STORAGE_KEYS.model, value.trim());
    } else {
      localStorage.removeItem(AI_STORAGE_KEYS.model);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey || apiKey.trim().length < 8) {
      setTestResult({
        ok: false,
        message: "Collez d'abord votre clé API dans le champ ci-dessus.",
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Vraie requête via le proxy : valide la clé ET le modèle exactement
      // comme le fera l'assistant (mêmes validations, même endpoint).
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Tu es l'assistant IA de GradeAssist. Réponds en français, de manière très concise.",
            },
            {
              role: "user",
              content:
                "Test de connexion : réponds en une phrase que la clé fonctionne.",
            },
          ],
          providerId,
          apiKey: apiKey.trim(),
          ...(model.trim() ? { model: model.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.content) {
        const snippet = String(data.content).slice(0, 120);
        setTestResult({
          ok: true,
          message: `Connexion réussie à ${provider.name}${
            data.model ? ` (modèle ${data.model})` : ""
          }. Réponse : « ${snippet}${String(data.content).length > 120 ? "…" : ""} »`,
        });
      } else {
        setTestResult({
          ok: false,
          message:
            data?.error ||
            `Échec du test (${res.status}). Vérifiez votre clé et le nom du modèle.`,
        });
      }
    } catch {
      setTestResult({
        ok: false,
        message:
          "Impossible de joindre le serveur GradeAssist. Vérifiez votre connexion internet.",
      });
    } finally {
      setTesting(false);
    }
  };

  const provider = getAiProvider(providerId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <Label>Assistant IA — Fournisseur et clé API</Label>
        {apiKey && (
          <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
            <Check className="h-3 w-3 text-green-600" />
            Clé enregistrée
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Select value={providerId} onValueChange={handleProviderChange}>
            <SelectTrigger aria-label="Fournisseur IA">
              <SelectValue placeholder="Choisir un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    {p.name}
                    {p.freeBadge && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[9px] text-green-700 border-green-600/40"
                      >
                        {p.freeBadge}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {provider.description}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={`Collez votre clé ${provider.name} ici`}
              className="pl-9"
              autoComplete="off"
            />
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Obtenez une clé sur{" "}
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline inline-flex items-center gap-0.5"
            >
              {provider.docsUrl.replace(/^https?:\/\//, "")}
              <ExternalLink className="h-3 w-3" />
            </a>
            . Elle reste sur votre appareil.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aiModel" className="text-xs text-muted-foreground">
          Modèle (optionnel — défaut : {provider.defaultModel})
        </Label>
        <Input
          id="aiModel"
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          placeholder={provider.defaultModel}
          className="h-8 text-xs"
        />
      </div>

      {/* Test de la clé : vraie requête via le proxy /api/ai */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-accent/30 text-accent hover:bg-accent/10 hover:text-accent"
            onClick={handleTestKey}
            disabled={testing || !apiKey}
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FlaskConical className="h-3.5 w-3.5" />
            )}
            {testing ? "Test en cours…" : "Tester la clé"}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Vérifie la clé et le modèle auprès du fournisseur.
          </span>
        </div>
        {testResult && (
          <p
            className={cn(
              "text-[11px] leading-snug flex items-start gap-1.5 rounded-md px-2 py-1.5",
              testResult.ok
                ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950/30"
                : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30"
            )}
          >
            {testResult.ok ? (
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </p>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/70">
        Aucun fournisseur gratuit ne fonctionne plus par défaut : chaque
        enseignant utilise sa propre clé (RoutesMe, Groq et Gemini proposent des
        accès gratuits).
      </p>
    </div>
  );
}
