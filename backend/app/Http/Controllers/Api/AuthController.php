<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller {

    /** POST /api/register */
    public function register(Request $request) {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users',
            'password'          => 'required|min:8|confirmed',
            'organization_name' => 'required|string|max:255',
            'role'              => 'sometimes|in:admin,agent,customer',
        ]);

        // Create org with a URL-safe slug
        $org = Organization::create([
            'name' => $data['organization_name'],
            'slug' => \Str::slug($data['organization_name']) . '-' . uniqid(),
        ]);

        $user = User::create([
            'name'            => $data['name'],
            'email'           => $data['email'],
            'password'        => Hash::make($data['password']),
            'organization_id' => $org->id,
            'role'            => $data['role'] ?? 'admin',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'         => $user,
            'organization' => $org,
            'token'        => $token,
        ], 201);
    }

    /** POST /api/login */
    public function login(Request $request) {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $user->load('organization'),
            'token' => $token,
        ]);
    }

    /** POST /api/logout */
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out.']);
    }

    /** GET /api/me */
    public function me(Request $request) {
        return response()->json($request->user()->load('organization'));
    }
}
