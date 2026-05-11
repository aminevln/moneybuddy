/**
 * Chiamate API per gli endpoint /auth/*.
 */

import { apiFetch } from "@/lib/api/client";
import type { LoginResponse, RegisterResponse, TokenPair, User } from "./types";


// ============================================================
// REGISTER
// ============================================================

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,  // endpoint pubblico
  });
}


// ============================================================
// LOGIN
// ============================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}


// ============================================================
// REFRESH
// ============================================================

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return apiFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
    skipAuth: true,
  });
}


// ============================================================
// ME (richiede token)
// ============================================================

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me", {
    method: "GET",
  });
}