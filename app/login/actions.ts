"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function login(formData) {
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const data = {
    email: formData["email"],
    password: formData["password"],
  };

  const client = await createClient();
  const response = await client.auth.signInWithPassword(data);
  if (response.error) {
    return response
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: Record<string, string>) {
  const data = {
    email: formData["email"],
    password: formData["password"],
  };

  const client = await createClient();
  const response = await client.auth.signUp(data);

  if (response.error != null) {
    return response
  }

}
