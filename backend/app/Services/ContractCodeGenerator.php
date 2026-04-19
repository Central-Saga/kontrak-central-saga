<?php

namespace App\Services;

use App\Models\Contract;

class ContractCodeGenerator
{
    private const PREFIX = 'CSM';

    /**
     * Roman numerals for months (I to XII)
     */
    private const ROMAN_MONTHS = [
        1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
        5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
        9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
    ];

    /**
     * Generate a contract number in format: CSM-ROMAN_MONTH-YEAR-SEQ
     * Example: CSM-V-2025-0001
     */
    public function generate(): string
    {
        $month = self::ROMAN_MONTHS[now()->month];
        $year = now()->year;
        $prefix = implode('-', [self::PREFIX, $month, (string) $year]);

        // Get the highest sequence number for current month/year
        $lastContract = Contract::where('contract_number', 'like', $prefix.'-%')
            ->orderBy('contract_number', 'desc')
            ->first();

        if ($lastContract) {
            // Extract sequence number from last contract number
            $lastSequence = (int) substr($lastContract->contract_number, -4);
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix.'-'.str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a unique contract number and ensure it's not already taken
     */
    public function generateUnique(): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        do {
            $code = $this->generate();
            $exists = Contract::where('contract_number', $code)->exists();
            $attempt++;
        } while ($exists && $attempt < $maxAttempts);

        if ($exists) {
            // Fallback: use timestamp-based code
            return self::PREFIX.'-'.now()->format('n-Y-His');
        }

        return $code;
    }
}
