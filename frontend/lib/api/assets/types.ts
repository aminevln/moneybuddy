/**
 * Tipi per UserAsset. Match con app/schemas/asset.py.
 */


export interface UserAsset {
  id: string;
  name: string;
  asset_type: string;
  attributes: Record<string, unknown>;
}


export interface UserAssetCreatePayload {
  name: string;
  asset_type: string;
  attributes?: Record<string, unknown>;
}


export interface UserAssetUpdatePayload {
  name?: string;
  asset_type?: string;
  attributes?: Record<string, unknown>;
}


// ============================================================
// PRESET ASSET TYPES
// ============================================================
// Sono solo "suggerimenti" all'utente per coerenza, ma asset_type è
// una stringa libera lato DB. L'utente può scrivere quello che vuole.

export const ASSET_TYPE_PRESETS: Array<{ value: string; label: string; emoji: string }> = [
  { value: "car",       label: "Auto / Moto",  emoji: "🚗" },
  { value: "home",      label: "Casa",         emoji: "🏠" },
  { value: "pet",       label: "Animale",      emoji: "🐾" },
  { value: "tech",      label: "Tecnologia",   emoji: "💻" },
  { value: "instrument", label: "Strumento",   emoji: "🎸" },
  { value: "other",     label: "Altro",        emoji: "📦" },
];


/**
 * Emoji per asset_type. Se il tipo non è in ASSET_TYPE_PRESETS, ritorna 📦.
 */
export function getAssetEmoji(type: string): string {
  return ASSET_TYPE_PRESETS.find((p) => p.value === type)?.emoji ?? "📦";
}


/**
 * Label per asset_type. Se il tipo non è in ASSET_TYPE_PRESETS, ritorna il valore originale.
 */
export function getAssetLabel(type: string): string {
  return ASSET_TYPE_PRESETS.find((p) => p.value === type)?.label ?? type;
}