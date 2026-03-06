import { authClient } from "@/app/_lib/auth-client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session.data?.user) {
    redirect("/auth");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Página Inicial</h1>
      <p className="text-zinc-400 mt-2">
        Você está logado como {session.data.user.email}
      </p>
    </div>
  );
}
