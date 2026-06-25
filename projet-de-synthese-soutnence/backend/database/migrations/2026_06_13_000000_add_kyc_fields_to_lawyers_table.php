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
        Schema::table('lawyers', function (Blueprint $table) {
            $table->string('cin_front')->nullable();
            $table->string('cin_back')->nullable();
            $table->string('selfie')->nullable();
            $table->string('bar_number')->nullable();
            $table->string('bar_city')->nullable();
            $table->string('professional_doc')->nullable();
            $table->string('verification_status')->default('pending_review'); // pending_review, approved, rejected
            $table->text('rejection_reason')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lawyers', function (Blueprint $table) {
            $table->dropColumn([
                'cin_front',
                'cin_back',
                'selfie',
                'bar_number',
                'bar_city',
                'professional_doc',
                'verification_status',
                'rejection_reason',
                'reviewed_at',
                'reviewed_by',
            ]);
        });
    }
};
