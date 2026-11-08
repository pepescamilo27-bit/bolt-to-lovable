import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Client-only route gate: send signed-out visitors to the sign-in page. */
export async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw redirect({ to: "/auth" });
  return { user: data.user };
}
