import { redirect } from "next/navigation";

export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || "/admin/project-blueprint";
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
