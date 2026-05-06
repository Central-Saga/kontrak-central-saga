import { access } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSidebar } from "@/components/app-sidebar";
import { AppUserMenu } from "@/components/app-user-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  buildSessionExpiredRedirectPath,
  LOGIN_PATH,
  readSessionState,
} from "@/lib/auth";

type AppLayoutProps = {
  children: ReactNode;
};

const BRAND_LOGO_PATH = "/brand/logo.png";

async function hasBrandLogoAsset() {
  try {
    await access(join(process.cwd(), "public", "brand", "logo.png"));
    return true;
  } catch {
    return false;
  }
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await readSessionState();

  if (session.status === "guest") {
    redirect(LOGIN_PATH);
  }

  if (session.status === "stale") {
    redirect(buildSessionExpiredRedirectPath());
  }

  const hasLogoAsset = await hasBrandLogoAsset();

  return (
    <SidebarProvider>
      <AppSidebar hasLogoAsset={hasLogoAsset} logoPath={BRAND_LOGO_PATH} user={session.user} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <div className="min-w-0 flex-1">
            <AppBreadcrumbs />
          </div>
          <AppUserMenu user={session.user} />
        </header>
        <div data-testid="app-shell" className="min-h-0 flex flex-1 flex-col overflow-hidden">
          <div data-testid="app-shell-scroll-region" className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col p-4 md:p-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
