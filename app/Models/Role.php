<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role');
    }

    public function hasPermission($permission): bool
    {
        return $this->permissions()->where('name', $permission)->exists();
    }

    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            $perms = explode(' ', $permission);
            $bool = true;
            foreach ($perms as $perm) {
                if (!$this->hasPermission($perm)) {
                    $bool = false;
                    break;
                }
            }
            if ($bool) {
                return true;
            }
        }
        return false;
    }

    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            $perms = explode(' ', $permission);
            foreach ($perms as $perm) {
                if (!$this->hasPermission($perm)) {
                    return false;
                }
            }
        }
        return true;
    }

    public function assignPermission($permission): void
    {
        $perms = explode(' ', $permission);
        foreach ($perms as $perm) {
            if (!$this->hasPermission($perm)) {
                $this->permissions()->attach($perm);
            }
        }
    }

    public function revokePermission($permission): void
    {
        $perms = explode(' ', $permission);
        foreach ($perms as $perm) {
            if ($this->hasPermission($perm)) {
                $this->permissions()->detach($perm);
            }
        }
    }
}
