<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'subject',
        'description',
        'status',
        'priority',
        'requester_id',
        'assignee_id',
        'tags',
        'sla_breached',
        'first_response_at',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'sla_breached' => 'boolean',
            'first_response_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function scopeForOrg(Builder $query, int $orgId): Builder
    {
        return $query->where('organization_id', $orgId);
    }
}
