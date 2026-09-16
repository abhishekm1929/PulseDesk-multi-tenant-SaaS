<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /** GET /api/dashboard */
    public function index(Request $request)
    {
        $orgId = $request->_org_id;
        $range = $request->query('time_range', 'all');

        $query = Ticket::where('organization_id', $orgId);

        if ($range === 'today') {
            $query->where('created_at', '>=', Carbon::today());
        } elseif ($range === '7d') {
            $query->where('created_at', '>=', Carbon::now()->subDays(7));
        } elseif ($range === '30d') {
            $query->where('created_at', '>=', Carbon::now()->subDays(30));
        }

        $tickets = $query->get();

        $byStatus = [
            'open'     => $tickets->where('status', 'open')->count(),
            'pending'  => $tickets->where('status', 'pending')->count(),
            'resolved' => $tickets->where('status', 'resolved')->count(),
            'closed'   => $tickets->where('status', 'closed')->count(),
        ];

        $byPriority = [
            'urgent' => $tickets->where('priority', 'urgent')->count(),
            'high'   => $tickets->where('priority', 'high')->count(),
            'medium' => $tickets->where('priority', 'medium')->count(),
            'low'    => $tickets->where('priority', 'low')->count(),
        ];

        $totalCount = $tickets->count();
        $resolvedCount = $byStatus['resolved'] + $byStatus['closed'];
        $resolutionRate = $totalCount > 0 ? round(($resolvedCount / $totalCount) * 100) : 0;

        $slaBreachedCount = $tickets->where('sla_breached', true)->count();

        $respondedTickets = $tickets->filter(fn($t) => !empty($t->first_response_at) && !empty($t->created_at));
        $avgFirstResponse = $respondedTickets->count() > 0
            ? (int) round($respondedTickets->avg(fn($t) => Carbon::parse($t->created_at)->diffInMinutes(Carbon::parse($t->first_response_at))))
            : 0;

        // 7-day volume and resolution trends
        $dailyTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $createdCount = Ticket::where('organization_id', $orgId)
                ->whereBetween('created_at', [$dayStart, $dayEnd])
                ->count();

            $resolvedDayCount = Ticket::where('organization_id', $orgId)
                ->whereIn('status', ['resolved', 'closed'])
                ->whereBetween('updated_at', [$dayStart, $dayEnd])
                ->count();

            $dailyTrends[] = [
                'date'     => $date->format('M d'),
                'day'      => $date->format('D'),
                'created'  => $createdCount,
                'resolved' => $resolvedDayCount,
            ];
        }

        // Agent performance stats
        $agents = User::where('organization_id', $orgId)
            ->whereIn('role', ['admin', 'agent'])
            ->get();

        $allOrgTickets = Ticket::where('organization_id', $orgId)->get();

        $agentStats = $agents->map(function ($agent) use ($allOrgTickets) {
            $assigned = $allOrgTickets->where('assignee_id', $agent->id);
            $resolved = $assigned->whereIn('status', ['resolved', 'closed'])->count();
            $open = $assigned->where('status', 'open')->count();
            $urgent = $assigned->where('priority', 'urgent')->where('status', 'open')->count();

            return [
                'id'             => $agent->id,
                'name'           => $agent->name,
                'email'          => $agent->email,
                'role'           => $agent->role,
                'assigned_count' => $assigned->count(),
                'resolved_count' => $resolved,
                'open_count'     => $open,
                'urgent_count'   => $urgent,
            ];
        });

        // Recent activity feed (up to 8 events)
        $recentActivity = ActivityLog::whereHas('ticket', fn($q) => $q->where('organization_id', $orgId))
            ->with([
                'user:id,name,role',
                'ticket:id,subject,status',
            ])
            ->latest()
            ->take(8)
            ->get();

        // Recent tickets for quick actions
        $recentTickets = Ticket::where('organization_id', $orgId)
            ->with([
                'requester:id,name,email',
                'assignee:id,name,email',
            ])
            ->latest()
            ->take(6)
            ->get();

        return response()->json([
            'time_range'              => $range,
            'total_count'             => $totalCount,
            'resolution_rate'         => $resolutionRate,
            'by_status'               => $byStatus,
            'by_priority'             => $byPriority,
            'sla_breached_count'      => $slaBreachedCount,
            'avg_first_response_mins' => $avgFirstResponse,
            'daily_trends'            => $dailyTrends,
            'agent_stats'             => $agentStats,
            'recent_activity'         => $recentActivity,
            'recent_tickets'          => $recentTickets,
        ]);
    }
}
