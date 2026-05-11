"use client";

/**
 * Custom hook per leggere il context di auth.
 *
 * Uso:
 *   const { user, login, logout } = useAuth();
 */

import { useContext } from "react";
import { AuthContext } from "./AuthProvider";


export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth deve essere usato dentro <AuthProvider>"
    );
  }
  return ctx;
}