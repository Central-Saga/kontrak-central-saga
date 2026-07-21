<?php

use App\Models\ProjectProgress;
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
        Schema::table('project_progress', function (Blueprint $table) {
            $table->unsignedTinyInteger('accumulated_percentage')->default(0)->after('percentage');
        });

        ProjectProgress::query()
            ->orderBy('contract_id')
            ->orderBy('progress_date')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->groupBy('contract_id')
            ->each(function ($rows) {
                $running = 0;

                foreach ($rows as $row) {
                    $running = min(100, $running + (int) $row->percentage);

                    if ((int) $row->accumulated_percentage !== $running) {
                        $row->update(['accumulated_percentage' => $running]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_progress', function (Blueprint $table) {
            $table->dropColumn('accumulated_percentage');
        });
    }
};
