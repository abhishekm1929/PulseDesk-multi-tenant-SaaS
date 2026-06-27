<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Ticket;
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
            ->when($request->search,   fn($q) => $q->where(function($q) use ($request) {
                $q->where('subject', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(20);

        return response()->json($tickets);
    }

    /** POST /api/tickets */
    public function store(Request $request) {
        $data = $request->validate([
            'subject'     => 'required|string|max:255',
            'description' => 'required|string',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'tags'        => 'sometimes|array',
        ]);

        $ticket = Ticket::create([
            ...$data,
            'organization_id' => $request->_org_id,
            'requester_id'    => $request->user()->id,
            'status'          => 'open',
            'priority'        => $data['priority'] ?? 'medium',
        ]);

        ActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'action'    => 'created',
            'meta'      => ['subject' => $ticket->subject],
        ]);

        return response()->json($ticket->load('requester'), 201);
    }

    /** GET /api/tickets/{ticket} */
    public function show(Request $request, Ticket $ticket) {
        $this->authorizeTenant($request, $ticket);
        return response()->json(
            $ticket->load(['requester','assignee','comments.user','activityLogs.user'])
        );
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

        return response()->json($ticket->fresh()->load('assignee'));
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
