<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add status to follows table
        Schema::table('follows', function (Blueprint $table) {
            if (!Schema::hasColumn('follows', 'status')) {
                $table->string('status')->default('pending'); // pending, accepted
            }
        });

        // 2. Add read_at to messages table
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'read_at')) {
                $table->timestamp('read_at')->nullable();
            }
        });

        // 3. Create notifications table
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // follow_request, follow_accept, message
            $table->text('data')->nullable(); // Additional JSON payload
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('read_at');
        });

        Schema::table('follows', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
