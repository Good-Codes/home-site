import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { postAuthRedirect } from "@/lib/auth/callback-url";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  redirect(postAuthRedirect(params.next, session.user.role));
}
