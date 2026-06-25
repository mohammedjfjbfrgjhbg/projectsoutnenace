<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'premium' => \App\Http\Middleware\EnsureUserIsPremium::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'lawyer.approved' => \App\Http\Middleware\EnsureLawyerApproved::class,
        ]);

        // Enable CORS for frontend API integration
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
