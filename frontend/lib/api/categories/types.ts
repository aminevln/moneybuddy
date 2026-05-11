/**
 * Tipi per Category. Devono matchare gli schemi Pydantic del backend
 * (app/schemas/category.py).
 */

export interface Category {
  id: string;              // UUID
  user_id: string | null;  // null = sistema
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
}

export interface CategoryCreatePayload {
  name: string;
  parent_id?: string;
  icon?: string;
  color?: string;
}

export interface CategoryUpdatePayload {
  name?: string;
  parent_id?: string;
  icon?: string;
  color?: string;
}