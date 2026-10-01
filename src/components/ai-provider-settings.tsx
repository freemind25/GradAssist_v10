"use client";

import { useEffect, useState } from "react";
import { KeyRound, ExternalLink, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
 */
export function AiProviderSettings() {
  const [providerId, setProviderId] = useState(DEFAULT_AI_PROVIDER_ID);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

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
    localStorage.setItem(AI_STORAGE_KEYS.provider, id);
    // Le modèle sauvegardé peut ne pas exister chez le nouveau fournisseur
    setModel("");
    localStorage.removeItem(AI_STORAGE_KEYS.model);
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    if (value) {
      localStorage.setItem(AI_STORAGE_KEYS.apiKey, value);
      localStorage.removeItem(LEGACY_MISTRAL_KEY);
    } else {
      localStorage.removeItem(AI_STORAGE_KEYS.apiKey);
    }
  };

  const handleModelChange = (value: string) => {
    setModel(value);
    if (value) {
      localStorage.setItem(AI_STORAGE_KEYS.model, value.trim());
    } else {
      localStorage.removeItem(AI_STORAGE_KEYS.model);
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

      <p className="text-[11px] text-muted-foreground/70">
        Aucun fournisseur gratuit ne fonctionne plus par défaut : chaque
        enseignant utilise sa propre clé (RoutesMe, Groq et Gemini proposent des
        accès gratuits).
      </p>
    </div>
  );
}
