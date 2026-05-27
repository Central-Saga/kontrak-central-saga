"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"

const idFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "")
}

function formatDigits(digits: string) {
  if (!digits) {
    return ""
  }

  try {
    return idFormatter.format(BigInt(digits))
  } catch {
    return digits
  }
}

type CurrencyInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  name: string
  defaultValue?: string | number
  value?: string | number
  onValueChange?: (raw: string) => void
}

export function CurrencyInput({
  name,
  defaultValue,
  value,
  onValueChange,
  required,
  id,
  className,
  ...rest
}: CurrencyInputProps) {
  const initialDigits = React.useMemo(() => {
    const fallback = value ?? defaultValue
    if (fallback === undefined || fallback === null) {
      return ""
    }

    return digitsOnly(String(fallback))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [raw, setRaw] = React.useState<string>(initialDigits)
  const [display, setDisplay] = React.useState<string>(formatDigits(initialDigits))

  React.useEffect(() => {
    if (value === undefined || value === null) {
      return
    }

    const next = digitsOnly(String(value))
    setRaw(next)
    setDisplay(formatDigits(next))
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = digitsOnly(event.target.value)
    setRaw(next)
    setDisplay(formatDigits(next))
    onValueChange?.(next)
  }

  return (
    <>
      <Input
        {...rest}
        id={id}
        className={className}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={display}
        onChange={handleChange}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  )
}
