/**
 * Tipi condivisi del modulo auth.
 *
 * Devono matchare gli schemi Pydantic del backend (app/schemas/user.py).
 */

export interface User {
  id: string;  // UUID come stringa
  email: string;
  display_name: string;
  timezone: string;
  currency: string;
  salary_day: number | null;
  created_at: string;  // ISO datetime
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;  // "bearer"
}

export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

export interface RegisterResponse {
  user: User;
  tokens: TokenPair;
}