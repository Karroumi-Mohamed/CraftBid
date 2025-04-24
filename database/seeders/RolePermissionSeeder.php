<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::create([
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

        $admin = User::create(
            [
                'name' => 'Admin',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
            ]
        );
        
        $admin->roles()->attach($adminRole);

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
            'bid'
        ];

        $adminPermissions = [
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
            'bid'
        ];

        $verifierPermissions = [
            'read',
            'approve',
            'user',
        ];
        $buyerPermissions = [
            'read',
            'create',
            'update',
            'delete',
            'order',
            'product',
            'bid',
        ];
        $artisanPermissions = [
            'read',
            'create',
            'update',
            'delete',
            'product',
            'bid',
        ];

        foreach ($permissions as $permission) {
            Permission::create([
                'name' => $permission,
            ]);
        }

        $adminRole = Role::where('name', 'admin')->first();
        $verifierRole = Role::where('name', 'verifier')->first();
        $buyerRole = Role::where('name', 'buyer')->first();
        $artisanRole = Role::where('name', 'artisan')->first();


        foreach ($adminPermissions as $permission) {
            $adminRole->permissions()->attach(Permission::where('name', $permission)->first());
        }
        foreach ($verifierPermissions as $permission) {
            $verifierRole->permissions()->attach(Permission::where('name', $permission)->first());
        }
        foreach ($buyerPermissions as $permission) {
            $buyerRole->permissions()->attach(Permission::where('name', $permission)->first());
        }
        foreach ($artisanPermissions as $permission) {
            $artisanRole->permissions()->attach(Permission::where('name', $permission)->first());
        }

        $user = User::first();
        if ($user) {
            $user->roles()->attach($adminRole);
        }
    }
}
