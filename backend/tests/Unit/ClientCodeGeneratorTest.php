<?php

namespace Tests\Unit;

use App\Models\Client;
use App\Services\ClientCodeGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientCodeGeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_client_code_with_correct_format(): void
    {
        $generator = new ClientCodeGenerator;
        $code = $generator->generate();

        $this->assertMatchesRegularExpression('/^CLI-\d{4}-\d{4}$/', $code);
    }

    public function test_generates_sequential_codes(): void
    {
        $generator = new ClientCodeGenerator;

        // Without any clients, should start with 0001
        $code1 = $generator->generate();
        $this->assertEquals('0001', substr($code1, -4));

        // Create a client with this code
        Client::factory()->create(['client_code' => $code1]);

        // Next code should be 0002
        $code2 = $generator->generate();
        $this->assertEquals('0002', substr($code2, -4));
    }

    public function test_generates_year_specific_codes(): void
    {
        $generator = new ClientCodeGenerator;
        $code = $generator->generate();
        $currentYear = date('Y');

        $this->assertEquals((string) $currentYear, substr($code, 4, 4));
    }

    public function test_generate_unique_returns_unique_code(): void
    {
        $generator = new ClientCodeGenerator;

        // First call
        $code1 = $generator->generateUnique();

        // Should match format
        $this->assertMatchesRegularExpression('/^CLI-\d{4}-\d{4}$/', $code1);
    }
}
