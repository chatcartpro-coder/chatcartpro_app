"use server";

import { redirect } from "next/navigation";
import { prisma } from "@chatcartpro/db";
import { VERTICALS, type Vertical } from "@chatcartpro/shared-types";
import { createClient } from "@/lib/supabase/server";

export async function createTenant(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const existing = await prisma.user.findUnique({ where: { supabaseUserId: user.id } });
  if (existing) {
    redirect("/dashboard");
  }

  const businessName = (formData.get("businessName") as string)?.trim();
  const verticalInput = formData.get("vertical") as string;
  const vertical: Vertical = VERTICALS.includes(verticalInput as Vertical)
    ? (verticalInput as Vertical)
    : "other";

  if (!businessName) {
    redirect("/onboarding?error=Business+name+is+required");
  }

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: businessName, vertical },
    });

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        supabaseUserId: user.id,
        email: user.email ?? "",
        role: "owner",
      },
    });

    await tx.plan.create({
      data: {
        tenantId: tenant.id,
        tierName: "starter",
        contactLimit: 1000,
        messageLimit: 5000,
        wabaNumberLimit: 1,
      },
    });
  });

  redirect("/dashboard");
}
