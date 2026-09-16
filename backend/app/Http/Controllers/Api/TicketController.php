<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class TicketController extends Controller {

    /** GET /api/tickets */
    public function index(Request $request) {
        $orgId = $request->_org_id;

        $tickets = Ticket::forOrg($orgId)
            ->with(['requester:id,name,email', 'assignee:id,name,email'])
            ->when($request->status,   fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->assignee_id, fn($q) => $q->where('assignee_id', $request->assignee_id))
            ->when($request->boolean('sla_breached'), fn($q) => $q->where('sla_breached', true))
            ->when($request->search,   fn($q) => $q->where(function($q) use ($request) {
                $q->where('subject', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate($request->query('per_page', 20));

        return response()->json($tickets);
    }

    /** GET /api/agents */
    public function agents(Request $request) {
        $agents = User::where('organization_id', $request->_org_id)
            ->whereIn('role', ['admin', 'agent'])
            ->select('id', 'name', 'email', 'role')
            ->get();

        return response()->json($agents);
    }

    /** GET /api/tickets/export/csv */
    public function exportCsv(Request $request) {
        $orgId = $request->_org_id;
        $tickets = Ticket::forOrg($orgId)
            ->with(['requester:id,name', 'assignee:id,name'])
            ->latest()
            ->get();

        $filename = 'tickets-' . date('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($tickets) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Subject', 'Status', 'Priority', 'Requester', 'Assignee', 'SLA Breached', 'Created At']);

            foreach ($tickets as $t) {
                fputcsv($handle, [
                    $t->id,
                    $t->subject,
                    $t->status,
                    $t->priority,
                    $t->requester ? $t->requester->name : 'N/A',
                    $t->assignee ? $t->assignee->name : 'Unassigned',
                    $t->sla_breached ? 'Yes' : 'No',
                    $t->created_at ? $t->created_at->toIso8601String() : '',
                ]);
            }
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /** POST /api/tickets */
    public function store(Request $request) {
        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'description' => 'required|string',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assignee_id' => 'sometimes|nullable|exists:users,id',
            'tags'        => 'sometimes|array',
        ]);

        $ticket = Ticket::create([
            ...$data,
            'organization_id' => $request->_org_id,
            'requester_id'    => $request->user()->id,
            'status'          => 'open',
            'priority'        => $data['priority'] ?? 'medium',
            'sla_breached'    => ($data['priority'] ?? 'medium') === 'urgent',
        ]);

        ActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'action'    => 'created',
            'meta'      => ['subject' => $ticket->subject],
        ]);

        return response()->json($ticket->load(['requester', 'assignee']), 201);
    }

    /** GET /api/tickets/{ticket} */
    public function show(Request $request, Ticket $ticket) {
        $this->authorizeTenant($request, $ticket);
        return response()->json(
            $ticket->load([
                'requester:id,name,email,role',
                'assignee:id,name,email,role',
                'comments.user:id,name,role',
                'activityLogs.user:id,name,role',
            ])
        );
    }

    /** PATCH /api/tickets/{ticket}/quick-update */
    public function quickUpdate(Request $request, Ticket $ticket) {
        $this->authorizeTenant($request, $ticket);

        $data = $request->validate([
            'status'      => 'sometimes|in:open,pending,resolved,closed',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assignee_id' => 'sometimes|nullable|exists:users,id',
        ]);

        $old = $ticket->only(['status', 'priority', 'assignee_id']);
        $ticket->update($data);

        foreach ($data as $field => $value) {
            if (array_key_exists($field, $old) && $old[$field] != $value) {
                ActivityLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $request->user()->id,
                    'action'    => "{$field}_changed",
                    'meta'      => ['from' => $old[$field], 'to' => $value],
                ]);
            }
        }

        return response()->json($ticket->fresh()->load(['requester:id,name,email', 'assignee:id,name,email']));
    }

    /** PUT /api/tickets/{ticket} */
    public function update(Request $request, Ticket $ticket) {
        $this->authorizeTenant($request, $ticket);

        $data = $request->validate([
            'subject'     => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'status'      => 'sometimes|in:open,pending,resolved,closed',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assignee_id' => 'sometimes|nullable|exists:users,id',
            'tags'        => 'sometimes|array',
        ]);

        $old = $ticket->only(['status','priority','assignee_id']);
        $ticket->update($data);

        // Log what changed
        foreach ($data as $field => $value) {
            if (isset($old[$field]) && $old[$field] != $value) {
                ActivityLog::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $request->user()->id,
                    'action'    => "{$field}_changed",
                    'meta'      => ['from' => $old[$field], 'to' => $value],
                ]);
            }
        }

        return response()->json($ticket->fresh()->load(['requester', 'assignee']));
    }

    /** DELETE /api/tickets/{ticket} */
    public function destroy(Request $request, Ticket $ticket) {
        $this->authorizeTenant($request, $ticket);
        $ticket->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    /** CRITICAL: prevent cross-tenant access */
    private function authorizeTenant(Request $request, Ticket $ticket): void {
        if ($ticket->organization_id !== $request->_org_id) {
            abort(403, 'Cross-tenant access denied.');
        }
    }
}
