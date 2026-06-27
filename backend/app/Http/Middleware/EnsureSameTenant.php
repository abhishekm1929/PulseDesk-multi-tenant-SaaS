<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSameTenant
{
    /**
     * Prevent cross-tenant data leaks.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !$user->organization_id) {
            return response()->json([
                'message' => 'No organization assigned.'
            ], 403);
        }

        // Bind organization id from authenticated user
        $request->merge([
            '_org_id' => $user->organization_id
        ]);

        return $next($request);
    }
}
