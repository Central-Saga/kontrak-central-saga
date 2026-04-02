import type { ComponentProps } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";

type BannerTone = "default" | "destructive";

type StatusBannerProps = {
  error?: string;
  messages?: Record<string, string>;
  status?: string;
};

type PageHeaderProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  eyebrow?: string;
  title: string;
};

type SelectionGroupProps = {
  description: string;
  emptyMessage: string;
  inputName: string;
  legend: string;
  options: Array<{
    id: number;
    name: string;
    meta?: string;
  }>;
  selectedIds?: number[];
};

export function PageStack({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-6", className)} {...props} />;
}

export function PageHeaderCard({
  actionHref,
  actionLabel,
  description,
  eyebrow = "Manajemen akses",
  title,
}: PageHeaderProps) {
  return (
    <Card>
      <CardHeader className="gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-highlight">{eyebrow}</p>
          <div className="flex flex-col gap-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>

        {actionHref && actionLabel ? (
          <Link className={buttonVariants({ size: "lg" })} href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </CardHeader>
    </Card>
  );
}

export function StatusBanner({ error, messages, status }: StatusBannerProps) {
  const tone: BannerTone = error ? "destructive" : "default";
  const message = error ? error : status ? messages?.[status] : undefined;

  if (!message) {
    return null;
  }

  return (
    <Alert variant={tone}>
      <AlertTitle>{tone === "destructive" ? "Perlu perhatian" : "Perubahan tersimpan"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function EmptyStateCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card>
      <CardContent className="py-10">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-7 text-muted">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PillList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: string[];
}) {
  if (!items.length) {
    return <span className="text-sm text-muted">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-line bg-card-strong px-2.5 py-1 text-xs font-medium text-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function BackLinkButton({ href }: { href: string }) {
  return (
    <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={href}>
      Kembali ke daftar
    </Link>
  );
}

export function SelectionGroup({
  description,
  emptyMessage,
  inputName,
  legend,
  options,
  selectedIds = [],
}: SelectionGroupProps) {
  return (
    <FieldSet>
      <div className="flex flex-col gap-2">
        <FieldLegend>{legend}</FieldLegend>
        <FieldDescription>{description}</FieldDescription>
      </div>

      {options.length ? <input name={`${inputName}_present`} type="hidden" value="1" /> : null}

      {options.length ? (
        <div data-slot="checkbox-group" className="grid gap-3">
          {options.map((option) => {
            const inputId = `${inputName}-${option.id}`;

            return (
              <Field
                key={option.id}
                className="rounded-2xl border border-line bg-card-strong px-4 py-3"
                orientation="horizontal"
              >
                <input
                  className="mt-1 size-4 rounded-sm border border-input accent-primary"
                  defaultChecked={selectedIds.includes(option.id)}
                  id={inputId}
                  name={inputName}
                  type="checkbox"
                  value={option.id}
                />
                <FieldContent>
                  <FieldLabel htmlFor={inputId}>{option.name}</FieldLabel>
                  {option.meta ? <FieldDescription>{option.meta}</FieldDescription> : null}
                </FieldContent>
              </Field>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-card-strong px-4 py-4 text-sm text-muted">
          {emptyMessage}
        </div>
      )}
    </FieldSet>
  );
}
