<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('name');
        });

        DB::table('users')
            ->select(['id', 'email'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                $emailLocalPart = Str::of((string) $user->email)
                    ->before('@')
                    ->lower()
                    ->replaceMatches('/[^a-z0-9._-]+/', '-')
                    ->trim('._-')
                    ->toString();

                $baseUsername = $emailLocalPart !== '' ? Str::limit($emailLocalPart, 240, '') : 'user';

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'username' => "{$baseUsername}-{$user->id}",
                    ]);
            });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
