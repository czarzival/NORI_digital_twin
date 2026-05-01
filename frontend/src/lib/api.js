import axios from 'axios'
import { supabase } from './supabaseClient'

const BASE = import.meta.env.VITE_API_URL || ''

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    Authorization: `Bearer ${session?.access_token}`
  }
}

export const apiPost = async (path, body) =>
  axios.post(BASE + path, body, { headers: await authHeaders() })

export const apiGet = async (path) =>
  axios.get(BASE + path, { headers: await authHeaders() })

export const apiPatch = async (path, body) =>
  axios.patch(BASE + path, body, { headers: await authHeaders() })
