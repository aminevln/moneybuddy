"use client";

/**
 * Form per creare/modificare una categoria.
 *
 * Modalità "create" (initial=undefined) o "edit" (initial=Category).
 * Chiama onSuccess dopo creazione/modifica riuscita.
 */

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getErrorMessage } from "@/lib/api/errors";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type Category,
} from "@/lib/api/categories";


// Palette di colori predefinita
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#64748b",
];


interface CategoryFormProps {
  initial?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ initial, onSuccess, onCancel }: CategoryFormProps) {
  const isEdit = !!initial;
  
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: { name: name.trim(), color },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          color,
        });
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={error} />
      
      <div>
        <Label htmlFor="cat-name">Nome categoria</Label>
        <Input
          id="cat-name"
          type="text"
          placeholder="Es. Caffè del mattino"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      <div>
        <Label>Colore</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800" : "opacity-60 hover:opacity-100"}`}
              style={{ backgroundColor: c }}
              aria-label={`Colore ${c}`}
              disabled={isPending}
            />
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea categoria"}
        </Button>
      </div>
    </form>
  );
}