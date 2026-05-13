"use client";

/**
 * Form per creare/modificare un asset.
 *
 * Note tecniche:
 * - `attributes` (JSON libero) viene gestito come textarea con JSON string
 * - L'utente può scrivere JSON valido o lasciare vuoto
 * - Se l'utente è alle prime armi, può lasciare attributes vuoto
 */

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { getErrorMessage } from "@/lib/api/errors";
import {
  ASSET_TYPE_PRESETS,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  type UserAsset,
} from "@/lib/api/assets";


interface AssetFormProps {
  initial?: UserAsset;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssetForm({ initial, onSuccess, onCancel }: AssetFormProps) {
  const isEdit = !!initial;
  
  const [name, setName] = useState(initial?.name ?? "");
  const [assetType, setAssetType] = useState(initial?.asset_type ?? "car");
  const [attributesJson, setAttributesJson] = useState(
    initial && Object.keys(initial.attributes).length > 0
      ? JSON.stringify(initial.attributes, null, 2)
      : ""
  );
  const [error, setError] = useState<string | null>(null);
  
  const createMutation = useCreateAssetMutation();
  const updateMutation = useUpdateAssetMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  function parseAttributes(): Record<string, unknown> | null {
    const trimmed = attributesJson.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("Gli attributi devono essere un oggetto JSON tipo { \"chiave\": \"valore\" }");
        return null;
      }
      return parsed;
    } catch {
      setError("JSON non valido. Esempio: { \"colore\": \"rosso\" }");
      return null;
    }
  }
  
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    
    const attributes = parseAttributes();
    if (attributes === null) return;   // errore già settato
    
    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({
          id: initial.id,
          payload: {
            name: name.trim(),
            asset_type: assetType,
            attributes,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          asset_type: assetType,
          attributes,
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
        <Label htmlFor="asset-name">Nome</Label>
        <Input
          id="asset-name"
          type="text"
          placeholder="Es. Fiat Panda, Felix il gatto"
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
        <Label htmlFor="asset-type">Tipo</Label>
        <Select
          id="asset-type"
          value={assetType}
          onChange={(e) => setAssetType(e.target.value)}
          disabled={isPending}
        >
          {ASSET_TYPE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.emoji} {p.label}
            </option>
          ))}
        </Select>
      </div>
      
      <div>
        <Label htmlFor="asset-attributes">
          Attributi (opzionale, formato JSON)
        </Label>
        <textarea
          id="asset-attributes"
          placeholder={'{\n  "anno": 2018,\n  "targa": "AB123CD"\n}'}
          value={attributesJson}
          onChange={(e) => setAttributesJson(e.target.value)}
          rows={5}
          disabled={isPending}
          className="
            w-full px-4 py-2.5 rounded-lg
            bg-slate-900/50 text-slate-100 font-mono text-sm
            border border-slate-700
            focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
            disabled:opacity-50
            transition resize-y
          "
        />
        <p className="text-xs text-slate-500 mt-1">
          Dati extra che l'AI userà per ragionare (es. modello auto, razza gatto).
        </p>
      </div>
      
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annulla
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? "Salva modifiche" : "Crea asset"}
        </Button>
      </div>
    </form>
  );
}