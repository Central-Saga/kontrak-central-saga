<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AccessManagementExportsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
    }

    public function test_requires_authentication_for_access_management_export_endpoints(): void
    {
        $this->getJson('/api/v1/exports/users?format=csv')->assertUnauthorized();
        $this->getJson('/api/v1/exports/roles?format=csv')->assertUnauthorized();
        $this->getJson('/api/v1/exports/permissions?format=csv')->assertUnauthorized();
    }

    public function test_forbids_user_without_granular_export_users_permission(): void
    {
        Sanctum::actingAs(User::query()->where('email', 'finance@centralsaga.test')->firstOrFail());

        $this->get('/api/v1/exports/users?format=pdf')
            ->assertForbidden();
    }

    public function test_exports_users_as_csv_with_existing_list_filters(): void
    {
        $admin = User::query()->where('email', 'admin@centralsaga.test')->firstOrFail();
        Sanctum::actingAs($admin);

        $financeRoleId = (int) Role::query()
            ->where('name', 'finance')
            ->value('id');

        $this->get('/api/v1/exports/users?format=csv&search=central&role_id='.$financeRoleId)
            ->assertOk()
            ->assertDownload('users-report.csv');
    }

    public function test_exports_roles_as_pdf_with_existing_list_filters(): void
    {
        Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

        $readUsersPermissionId = (int) Permission::query()
            ->where('name', 'read users')
            ->value('id');

        $this->get('/api/v1/exports/roles?format=pdf&search=admin&permission_id='.$readUsersPermissionId)
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_exports_permissions_as_csv_with_existing_list_filters(): void
    {
        Sanctum::actingAs(User::query()->where('email', 'admin@centralsaga.test')->firstOrFail());

        $this->get('/api/v1/exports/permissions?format=csv&search=users&action=read&module=users')
            ->assertOk()
            ->assertDownload('permissions-report.csv');
    }
}
