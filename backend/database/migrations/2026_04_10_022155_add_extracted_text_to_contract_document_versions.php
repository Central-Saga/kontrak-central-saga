<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contract_document_versions', function (Blueprint $table) {
            $table->longText('extracted_text')->nullable()->after('change_summary');
            $table->timestamp('text_extracted_at')->nullable()->after('extracted_text');
        });
    }

    public function down(): void
    {
        Schema::table('contract_document_versions', function (Blueprint $table) {
            $table->dropColumn(['extracted_text', 'text_extracted_at']);
        });
    }
};
