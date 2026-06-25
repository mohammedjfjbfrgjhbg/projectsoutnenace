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
        // 1. Add fields to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user'); // user, lawyer, admin
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable();
            }
            if (!Schema::hasColumn('users', 'address')) {
                $table->string('address')->nullable();
            }
            if (!Schema::hasColumn('users', 'is_premium')) {
                $table->boolean('is_premium')->default(false);
            }
            if (!Schema::hasColumn('users', 'premium_until')) {
                $table->dateTime('premium_until')->nullable();
            }
        });

        // 2. Create lawyers table
        Schema::create('lawyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('initial');
            $table->string('field');
            $table->string('field_key');
            $table->string('city');
            $table->integer('rating')->default(5);
            $table->integer('reviews')->default(0);
            $table->text('tags'); // Store as JSON string or comma-separated
            $table->integer('price');
            $table->boolean('available')->default(true);
            $table->string('avatar_color');
            $table->timestamps();
        });

        // 3. Create appointments table
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // client
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');
            $table->integer('day_index');
            $table->string('day_name');
            $table->string('date_string');
            $table->string('time');
            $table->string('status')->default('pending'); // pending, confirmed, cancelled
            $table->integer('price');
            $table->timestamps();
        });

        // 4. Create messages table
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('receiver_id')->constrained('users')->onDelete('cascade');
            $table->text('message')->nullable();
            $table->boolean('is_file')->default(false);
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->timestamps();
        });

        // 5. Create contracts table
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('type'); // analyze, generate
            $table->text('content')->nullable();
            $table->text('result')->nullable();
            $table->timestamps();
        });

        // 6. Create plans table
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->text('features'); // JSON string
            $table->integer('duration_days')->default(30);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
        Schema::dropIfExists('contracts');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('lawyers');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'phone', 'address', 'is_premium', 'premium_until']);
        });
    }
};
