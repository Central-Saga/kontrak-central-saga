import Link from "next/link";
import { FileTextIcon, GitCompareArrowsIcon, HistoryIcon, InfoIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

interface ContractNavigationTabsProps {
  contractId: number | string;
  activeTab: "detail" | "documents" | "compare" | "history";
  documentCount?: number;
}

export function ContractNavigationTabs({
  contractId,
  activeTab,
  documentCount,
}: ContractNavigationTabsProps) {
  const tabs = [
    {
      id: "detail",
      label: "Detail",
      href: `/app/contracts/${contractId}`,
      icon: InfoIcon,
      badge: undefined,
    },
    {
      id: "documents",
      label: "Dokumen",
      href: `/app/contracts/${contractId}/documents`,
      icon: FileTextIcon,
      badge: documentCount,
    },
    {
      id: "compare",
      label: "Komparasi",
      href: `/app/contracts/${contractId}/compare`,
      icon: GitCompareArrowsIcon,
      badge: undefined,
    },
    {
      id: "history",
      label: "Riwayat",
      href: `/app/contracts/${contractId}/history`,
      icon: HistoryIcon,
      badge: undefined,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-card-strong p-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={buttonVariants({
              variant: isActive ? "default" : "ghost",
              size: "sm",
            })}
          >
            <Icon className="mr-2 h-4 w-4" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
