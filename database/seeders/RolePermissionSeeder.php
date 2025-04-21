<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create([
            'name' => 'admin',
        ]);
        Role::create([
            'name' => 'verifier',
        ]);
        Role::create([
            'name' => 'buyer',
        ]);
        Role::create([
            'name' => 'artisan',
        ]);

        $permissions = [
            'create',
            'read',
            'update',
            'delete',
            'approve',
            'user',
            'role',
            'permission',
            'product',
            'order',
            'category',
        ];
        foreach ($permissions as $permission) {
            Role
        }


    }
}
