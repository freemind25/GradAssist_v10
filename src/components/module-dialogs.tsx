"use client";

import type * as React from 'react';
import { useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import type { EvaluationModule as EvaluationModuleType, ModuleType } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MenubarItem } from '@/components/ui/menubar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/** Dialogue de création d'une matière (nom + type d'évaluation). */
export function NewModuleDialog({
  onCreate,
  trigger,
}: {
  onCreate: (name: string, type: ModuleType) => void;
  trigger?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ModuleType>('atelier');
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nom manquant',
        description: 'Veuillez donner un nom à la nouvelle matière.',
      });
      return;
    }
    onCreate(name, type);
    setName('');
    setType('atelier');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <MenubarItem onSelect={(e) => e.preventDefault()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Nouveau Module...
          </MenubarItem>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle matière</DialogTitle>
          <DialogDescription>
            Choisissez un nom et un type d&apos;évaluation pour votre nouvelle
            matière ou atelier.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module-name" className="text-right">
              Nom
            </Label>
            <Input
              id="module-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Nom de la matière ou de l'atelier"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module-type" className="text-right">
              Type
            </Label>
            <RadioGroup
              className="col-span-3 flex flex-col gap-2"
              onValueChange={(value: ModuleType) => setType(value)}
              value={type}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="atelier" id="r-atelier" />
                <Label htmlFor="r-atelier" className="font-normal">
                  Atelier (Évaluation par critères)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="r-standard" />
                <Label htmlFor="r-standard" className="font-normal">
                  Matière Classique (CC + Examen)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mooc" id="r-mooc" />
                <Label htmlFor="r-mooc" className="font-normal">
                  Cours en ligne MOOC (CC + Examen)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Dialogue de configuration d'un module vierge (renommage + type). */
export function ConfigureModuleDialog({
  module,
  onConfigure,
  onDismiss,
}: {
  module: EvaluationModuleType;
  onConfigure: (moduleId: string, name: string, type: ModuleType) => void;
  onDismiss: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState(
    module.name === 'Nouvelle matière' ? '' : module.name
  );
  const [type, setType] = useState<ModuleType>(module.type);
  const { toast } = useToast();

  const handleConfigure = () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nom manquant',
        description: 'Veuillez donner un nom à la matière.',
      });
      return;
    }
    onConfigure(module.id, name, type);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleDismiss();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurer la matière</DialogTitle>
          <DialogDescription>
            Donnez un nom et choisissez le type d&apos;évaluation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="config-name" className="text-right">
              Nom
            </Label>
            <Input
              id="config-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Mathématiques, Physique..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <RadioGroup
              className="col-span-3 flex flex-col gap-2"
              onValueChange={(value: ModuleType) => setType(value)}
              value={type}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="atelier" id="c-atelier" />
                <Label htmlFor="c-atelier" className="font-normal">
                  Atelier (Évaluation par critères)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="c-standard" />
                <Label htmlFor="c-standard" className="font-normal">
                  Matière Classique (CC + Examen)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mooc" id="c-mooc" />
                <Label htmlFor="c-mooc" className="font-normal">
                  Cours en ligne MOOC (CC + Examen)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>
            Annuler
          </Button>
          <Button onClick={handleConfigure}>
            <Plus className="mr-2 h-4 w-4" />
            Configurer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
