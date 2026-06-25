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
        Schema::create('lawyer_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lawyer_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('client_name');
            $table->string('case_number');
            $table->string('case_type');
            $table->string('status')->default('upcoming_session'); // upcoming_session, under_review, completed
            $table->integer('progress')->default(0);
            $table->string('session_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lawyer_cases');
    }
};
