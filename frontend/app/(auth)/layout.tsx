import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  APP_HOME_PATH,
  buildSessionExpiredRedirectPath,
  readSessionState,
} from "@/lib/auth";

type AuthLayoutProps = {
  children: ReactNode;
};

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const session = await readSessionState();

  if (session.status === "authenticated") {
    redirect(APP_HOME_PATH);
  }

  if (session.status === "stale") {
    redirect(buildSessionExpiredRedirectPath());
  }

  return children;
}
