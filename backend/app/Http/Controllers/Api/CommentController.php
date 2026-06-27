<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Ticket;
use Illuminate\Http\Request;

class CommentController extends Controller {

    /** GET /api/tickets/{ticket}/comments */
    public function index(Request $request, Ticket $ticket) {
        if ($ticket->organization_id !== $request->_org_id) abort(403);

        $comments = $ticket->comments()
            ->with('user:id,name,role')
            ->when(
                $request->user()->isCustomer(),
                fn($q) => $q->where('type', 'public') // customers see public only
            )
            ->latest()->get();

        return response()->json($comments);
    }

    /** POST /api/tickets/{ticket}/comments */
    public function store(Request $request, Ticket $ticket) {
        if ($ticket->organization_id !== $request->_org_id) abort(403);

        $data = $request->validate([
            'body' => 'required|string',
            'type' => 'sometimes|in:public,internal',
        ]);

        // Customers can only post public comments
        if ($request->user()->isCustomer()) {
            $data['type'] = 'public';
        }

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'body'      => $data['body'],
            'type'      => $data['type'] ?? 'public',
        ]);

        // Mark first response time for SLA
        if (!$ticket->first_response_at && !$request->user()->isCustomer()) {
            $ticket->update(['first_response_at' => now()]);
        }

        ActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $request->user()->id,
            'action'    => 'replied',
            'meta'      => ['type' => $comment->type],
        ]);

        return response()->json($comment->load('user'), 201);
    }
}
