'use server'

import { createClient } from "@/utils/supabase/server";

export async function loadLeagues() {
  const client = await createClient();
  const response = await client.from('league').select('*');
  return response
}