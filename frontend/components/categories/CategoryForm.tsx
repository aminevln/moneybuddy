"use client";

/**
 * Form per creare/modificare una categoria.
 */

import { Check, Tag } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  type Category,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/api/errors";


// Palette di colori predefinita — coordinata con i token viz del design system
const PRESET_COLORS = [
  "#FF6B35",  // accent (arancione brand)
  "#EF4444",  // danger (rosso)
  "#F59E0B",  // warning (ambra)
  "#10B981",  // success (verde)
  "#06B6D4",  // cyan
  "#3B82F6",  // info (blu)
  "#8B5CF6",  // viola
  "#EC4899",  // rosa
  "#84CC16",  // lime
  "#6e6e7a",  // grigio neutro
];


interface CategoryFormProps {
  initial?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}


export function CategoryForm({
  initial,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
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
      
      {/* Nome */}
      <div>
        <Label htmlFor="cat-name" required>
          Nome categoria
        </Label>
        <Input
          id="cat-name"
          type="text"
          placeholder="Es. Caffè del mattino"
          iconLeft={<Tag className="w-4 h-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          autoFocus
          disabled={isPending}
        />
      </div>
      
      {/* Color picker */}
      <div>
        <Label>Colore</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => {
            const isSelected = color === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={isPending}
                aria-label={`Colore ${c}`}
                className={`
                  relative w-9 h-9 rounded-full
                  transition-transform duration-150
                  disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface
                  ${isSelected
                    ? "scale-110 ring-2 ring-fg-primary ring-offset-2 ring-offset-bg-surface"
                    : "opacity-70 hover:opacity-100 hover:scale-105"}
                `}
                style={{ backgroundColor: c }}
              >
                {isSelected && (
                  <Check
                    className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Preview */}
      <div className="flex items-center gap-2 p-3 bg-bg-elevated border border-border rounded-lg">
        <span className="text-xs text-fg-muted uppercase tracking-wider font-medium mr-1">
          Anteprima
        </span>
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-fg-primary font-medium truncate">
          {name.trim() || "Nome categoria"}
        </span>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
        >
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea categoria"}
        </Button>
      </div>
    </form>
  );
}