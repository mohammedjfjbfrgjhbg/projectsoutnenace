<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LawyerController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\PricingController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\LawyerRegistrationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\LawyerCaseController;
use Illuminate\Support\Facades\Route;

// 1. Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/lawyer-register', [LawyerRegistrationController::class, 'register']);

// 2. Public Pricing Plans Route
Route::get('/pricing/plans', [PricingController::class, 'getPlans']);

// Admin verification dashboard (hidden prefix)
Route::prefix('secure-admin-8392')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/lawyers', [AdminController::class, 'pendingLawyers']);
    Route::get('/lawyers/{id}', [AdminController::class, 'showLawyer']);
    Route::post('/lawyers/{id}/approve', [AdminController::class, 'approveLawyer']);
    Route::post('/lawyers/{id}/reject', [AdminController::class, 'rejectLawyer']);
});

// 3. Authenticated Routes (Require Sanctum Token)
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile (Accessible even if lawyer is not approved yet, so they can log out and check status)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Features protected by lawyer approval (non-lawyers pass through)
    Route::middleware('lawyer.approved')->group(function () {
        Route::put('/me', [AuthController::class, 'updateProfile']);

        // Lawyers
        Route::get('/lawyers', [LawyerController::class, 'index']);
        Route::get('/lawyers/{id}', [LawyerController::class, 'show']);
        Route::post('/lawyers', [LawyerController::class, 'store']);
        Route::post('/lawyers/{id}/reviews', [LawyerController::class, 'submitReview']);
        Route::get('/contracts', [AiController::class, 'getContracts']);

        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::put('/appointments/{id}', [AppointmentController::class, 'update']);
        Route::delete('/appointments/{id}', [AppointmentController::class, 'destroy']);

        // Lawyer Cases
        Route::get('/lawyer/cases', [LawyerCaseController::class, 'index']);
        Route::post('/lawyer/cases', [LawyerCaseController::class, 'store']);
        Route::put('/lawyer/cases/{id}', [LawyerCaseController::class, 'update']);
        Route::delete('/lawyer/cases/{id}', [LawyerCaseController::class, 'destroy']);

        // Chat / Messages
        Route::get('/messages', [ChatController::class, 'getMessages']);
        Route::post('/messages', [ChatController::class, 'sendMessage']);
        Route::post('/upload', [ChatController::class, 'uploadFile']);
        Route::get('/messages/contacts', [ChatController::class, 'getContacts']);
        Route::post('/messages/seen', [ChatController::class, 'markAsSeen']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

        // Subscribe to Plan
        Route::post('/pricing/subscribe', [PricingController::class, 'subscribe']);

        // Community Feed (Posts, Likes, Comments)
        Route::get('/posts/stats', [PostController::class, 'getStats']);
        Route::get('/posts', [PostController::class, 'index']);
        Route::post('/posts', [PostController::class, 'store']);
        Route::delete('/posts/{id}', [PostController::class, 'destroy']);
        Route::post('/posts/{id}/like', [PostController::class, 'toggleLike']);
        Route::post('/posts/{id}/comments', [PostController::class, 'addComment']);
        Route::delete('/comments/{id}', [PostController::class, 'deleteComment']);
        Route::post('/comments/{id}/like', [PostController::class, 'toggleCommentLike']);

        // User Profiles & Follows
        Route::get('/users/{id}/profile', [ProfileController::class, 'show']);
        Route::post('/users/{id}/follow', [ProfileController::class, 'toggleFollow']);
        Route::post('/users/{id}/accept-follow', [ProfileController::class, 'acceptFollow']);
        Route::post('/users/{id}/reject-follow', [ProfileController::class, 'rejectFollow']);
        Route::get('/users/{id}/followers', [ProfileController::class, 'getFollowers']);
        Route::get('/users/{id}/following', [ProfileController::class, 'getFollowing']);
        Route::post('/profile/update', [ProfileController::class, 'update']);

        // AI and Contract Routes (Free for all approved lawyers and client users)
        Route::post('/contracts/analyze', [AiController::class, 'analyzeContract']);
        Route::post('/contracts/generate', [AiController::class, 'generateContract']);
        Route::post('/ai/ask', [AiController::class, 'askAi']);
    });
});
