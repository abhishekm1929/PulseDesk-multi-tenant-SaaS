<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // All routes below are tenant-scoped
    Route::middleware(['tenant'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Tickets CRUD + filters
        Route::apiResource('tickets', TicketController::class);

        // Nested comments on tickets
        Route::get ('tickets/{ticket}/comments', [CommentController::class, 'index']);
        Route::post('tickets/{ticket}/comments', [CommentController::class, 'store']);
    });
});
