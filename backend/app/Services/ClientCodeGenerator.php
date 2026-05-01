<?php

namespace App\Services;

use App\Models\Client;

class ClientCodeGenerator
{
    /**
     * Generate a unique client code in format: CLI-{YEAR}-{SEQUENCE}
     * Example: CLI-2025-0001
     */
    public function generate(): string
    {
        $year = now()->year;
        $prefix = "CLI-{$year}-";

        // Get the highest sequence number for current year
        $lastClient = Client::where('client_code', 'like', $prefix.'%')
            ->orderBy('client_code', 'desc')
            ->first();

        if ($lastClient) {
            // Extract sequence number from last client code
            $lastSequence = (int) substr($lastClient->client_code, -4);
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix.str_pad($nextSequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate a unique client code and ensure it's not already taken
     */
    public function generateUnique(): string
    {
        $maxAttempts = 10;
        $attempt = 0;

        do {
            $code = $this->generate();
            $exists = Client::where('client_code', $code)->exists();
            $attempt++;
        } while ($exists && $attempt < $maxAttempts);

        if ($exists) {
            // Fallback: use timestamp-based code
            return 'CLI-'.now()->format('Ymd-His');
        }

        return $code;
    }
}
