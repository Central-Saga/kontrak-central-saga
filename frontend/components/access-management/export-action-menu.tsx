"use client";

import { ChevronDownIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportFormat = "csv" | "pdf";

type ExportActionMenuProps = {
  moduleLabel: string;
  queryString?: string;
  resource: "users" | "roles" | "permissions";
};

const exportOptions: Array<{
  description: string;
  format: ExportFormat;
  icon: typeof FileSpreadsheetIcon;
  label: string;
}> = [
  {
    description: "Unduh file spreadsheet untuk olah data lanjutan.",
    format: "csv",
    icon: FileSpreadsheetIcon,
    label: "Unduh CSV",
  },
  {
    description: "Unduh versi siap bagikan dalam format dokumen.",
    format: "pdf",
    icon: FileTextIcon,
    label: "Unduh PDF",
  },
];

function buildExportHref(resource: ExportActionMenuProps["resource"], queryString: string, format: ExportFormat) {
  const searchParams = new URLSearchParams(queryString);
  searchParams.set("format", format);

  return `/api/access-management/exports/${resource}?${searchParams.toString()}`;
}

export function ExportActionMenu({ moduleLabel, queryString = "", resource }: ExportActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid={`${resource}-export-trigger`} size="sm" type="button" variant="outline">
          <DownloadIcon aria-hidden data-icon="inline-start" />
          Ekspor data
          <ChevronDownIcon aria-hidden data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span>Ekspor {moduleLabel}</span>
            <span className="text-xs font-normal text-muted">
              File akan mengikuti filter yang sedang aktif pada halaman ini.
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {exportOptions.map((option) => {
            const Icon = option.icon;

            return (
              <DropdownMenuItem asChild key={option.format}>
                <a
                  data-testid={`${resource}-export-${option.format}`}
                  href={buildExportHref(resource, queryString, option.format)}
                >
                  <Icon aria-hidden />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted">{option.description}</span>
                  </div>
                </a>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
