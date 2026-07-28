import { Prisma, prisma } from "@chatcartpro/db";
import { createClient } from "@/lib/supabase/server";

type UserWithTenant = Prisma.UserGetPayload<{ include: { tenant: true } }>;

export interface CurrentSession {
  supabaseUserId: string;
  email: string;
  user: UserWithTenant | null;
}

/**
 * Resolves the logged-in Supabase user to our app's User/Tenant rows.
 * Returns null user if the Supabase account exists but hasn't completed
 * tenant onboarding yet — callers should redirect to /onboarding in that case.
 */
export async function getCurrentSession(): Promise<CurrentSession | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    include: { tenant: true },
  });

  return {
    supabaseUserId: authUser.id,
    email: authUser.email ?? "",
    user,
  };
}
