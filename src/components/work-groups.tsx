"use client";

import { useState } from "react";
import type { WorkGroup } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Trash2, Palette, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkGroupsProps {
  studentNames: string[];
  workGroups: WorkGroup[];
  onUpdate: (groups: WorkGroup[]) => void;
}

const GROUP_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function WorkGroups({ studentNames, workGroups, onUpdate }: WorkGroupsProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const validStudents = studentNames.filter((n) => n.trim());

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: WorkGroup = {
      id: `wg_${Date.now()}`,
      name: newGroupName.trim(),
      color: newGroupColor,
      studentNames: [],
    };

    onUpdate([...workGroups, newGroup]);
    setNewGroupName("");
  };

  const handleDeleteGroup = (groupId: string) => {
    onUpdate(workGroups.filter((g) => g.id !== groupId));
  };

  const handleAddStudentToGroup = (groupId: string, studentName: string) => {
    if (!studentName) return;

    // Remove student from any other group first
    const updatedGroups = workGroups.map((g) => ({
      ...g,
      studentNames: g.studentNames.filter((n) => n !== studentName),
    }));

    // Add to target group
    const finalGroups = updatedGroups.map((g) => {
      if (g.id === groupId && !g.studentNames.includes(studentName)) {
        return { ...g, studentNames: [...g.studentNames, studentName] };
      }
      return g;
    });

    onUpdate(finalGroups);
  };

  const handleRemoveStudentFromGroup = (groupId: string, studentName: string) => {
    const updatedGroups = workGroups.map((g) => {
      if (g.id === groupId) {
        return { ...g, studentNames: g.studentNames.filter((n) => n !== studentName) };
      }
      return g;
    });
    onUpdate(updatedGroups);
  };

  // Get students not in any group
  const assignedStudents = new Set(workGroups.flatMap((g) => g.studentNames));
  const unassignedStudents = validStudents.filter((n) => !assignedStudents.has(n));

  return (
    <Card className="card-premium overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500/60 via-violet-500 to-violet-500/60" />
      <CardHeader className="bg-gradient-to-r from-violet-500/5 to-transparent pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-500" />
          Groupes de travail
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create group form */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nom du groupe..."
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="h-10 w-10 rounded-lg border flex items-center justify-center"
              style={{ backgroundColor: newGroupColor }}
            >
              <Palette className="h-4 w-4 text-white" />
            </button>
            {showColorPicker && (
              <div className="absolute top-12 right-0 z-50 bg-card border rounded-lg p-2 shadow-lg grid grid-cols-4 gap-1">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setNewGroupColor(color);
                      setShowColorPicker(false);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-transform hover:scale-110",
                      newGroupColor === color && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Groups list */}
        {workGroups.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun groupe créé</p>
            <p className="text-xs mt-1">Créez des groupes pour organiser les travaux</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: group.color + "40" }}
              >
                {/* Group header */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ backgroundColor: group.color + "15" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-sm">{group.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({group.studentNames.length} étudiant{group.studentNames.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Students in group */}
                <div className="p-3 space-y-2">
                  {group.studentNames.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Aucun étudiant assigné
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {group.studentNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border"
                          style={{
                            borderColor: group.color + "40",
                            backgroundColor: group.color + "10",
                          }}
                        >
                          {name}
                          <button
                            onClick={() => handleRemoveStudentFromGroup(group.id, name)}
                            className="text-muted-foreground hover:text-destructive ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add student dropdown */}
                  {unassignedStudents.length > 0 && (
                    <select
                      onChange={(e) => {
                        handleAddStudentToGroup(group.id, e.target.value);
                        e.target.value = "";
                      }}
                      className="w-full px-2 py-1.5 rounded border bg-background text-xs"
                      defaultValue=""
                    >
                      <option value="" disabled>
                        + Ajouter un étudiant...
                      </option>
                      {unassignedStudents.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}

            {/* Unassigned students */}
            {unassignedStudents.length > 0 && (
              <div className="rounded-lg border border-dashed p-3 mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Étudiants non assignés ({unassignedStudents.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unassignedStudents.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
