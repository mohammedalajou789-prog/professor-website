'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * A small, NON-secret hint for the navbar: who is signed in ("admin" | "student").
 * Real access is still checked on the server for every page and API — this cookie only decides
 * which button the top bar shows (Admin panel / My courses / Sign in).
 */
export type Role = 'admin' | 'student'
const NAME = 'site-role'

export function setRoleHint(role: Role) {
  document.cookie = `${NAME}=${role}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
}
export function readRoleHint(): Role | null {
  const m = document.cookie.match(/(?:^|;\s*)site-role=(admin|student)/)
  return (m?.[1] as Role) || null
}
export function hasSession() {
  return /(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie)
}
export async function signOutAll(to = '/') {
  try { await createClient().auth.signOut() } catch {}
  document.cookie = `${NAME}=; path=/; max-age=0`
  window.location.href = to
}
