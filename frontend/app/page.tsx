import { redirect } from "next/navigation";

import {
  APP_HOME_PATH,
  buildSessionExpiredRedirectPath,
  LOGIN_PATH,
  readSessionState,
} from "@/lib/auth";

export default async function HomePage() {
  const session = await readSessionState();

  if (session.status === "authenticated") {
    redirect(APP_HOME_PATH);
  }

  if (session.status === "stale") {
    redirect(buildSessionExpiredRedirectPath());
  }

  redirect(LOGIN_PATH);
}
