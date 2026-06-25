<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Lawyer;
use App\Models\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Plans
        Plan::create([
            'name' => 'الخطة المجانية',
            'price' => 0.00,
            'features' => ['رصيد AI (15 سؤال)', 'عرض قائمة المحامين', 'متابعة العقود الأساسية'],
            'duration_days' => 30,
        ]);

        Plan::create([
            'name' => 'الخطة البريميوم',
            'price' => 199.00,
            'features' => ['رصيد AI غير محدود', 'تواصل مباشر مع المحامين', 'توليد عقود متقدمة', 'دعم فني 24/7'],
            'duration_days' => 30,
        ]);

        Plan::create([
            'name' => 'الخطة المهنية',
            'price' => 499.00,
            'features' => ['كل ميزات البريميوم', 'حساب خاص للمحامين', 'أدوات إدارة المواعيد', 'إحصائيات الأرباح والمشاهدات'],
            'duration_days' => 30,
        ]);

        // 2. Create a default test client
        User::create([
            'name' => 'محمد الفاسي',
            'email' => 'mohammed@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'phone' => '0612345678',
            'address' => 'الدار البيضاء، المغرب',
            'is_premium' => false,
        ]);

        // 3. Create Lawyers (Users + Lawyer profiles)
        $lawyerData = [
            [
                'name' => 'عمر الحسيني',
                'email' => 'omar@example.com',
                'initial' => 'ع',
                'field' => 'قانون الأعمال',
                'field_key' => 'الأعمال',
                'city' => 'الدار البيضاء',
                'rating' => 5,
                'reviews' => 203,
                'tags' => ['الشركات', 'العقود', 'الإفلاس'],
                'price' => 500,
                'available' => false,
                'avatar_color' => '#1e3a8a',
                'latitude' => 33.5600,
                'longitude' => -7.6000,
            ],
            [
                'name' => 'فاطمة الزهراء المرابطي',
                'email' => 'fatima@example.com',
                'initial' => 'ف',
                'field' => 'مدونة الأسرة',
                'field_key' => 'الأسرة',
                'city' => 'الرباط',
                'rating' => 4,
                'reviews' => 89,
                'tags' => ['الطلاق', 'الحضانة', 'النفقة'],
                'price' => 350,
                'available' => true,
                'avatar_color' => '#d97706',
                'latitude' => 34.0208,
                'longitude' => -6.8416,
            ],
            [
                'name' => 'يوسف البكالي',
                'email' => 'youssef@example.com',
                'initial' => 'ي',
                'field' => 'قانون الشغل',
                'field_key' => 'الشغل',
                'city' => 'الدار البيضاء',
                'rating' => 4,
                'reviews' => 127,
                'tags' => ['عقود الشغل', 'الطرد التعسفي', 'النزاعات'],
                'price' => 400,
                'available' => true,
                'avatar_color' => '#0369a1',
                'latitude' => 33.5900,
                'longitude' => -7.6200,
            ],
            [
                'name' => 'سمية أوحمو',
                'email' => 'soumya@example.com',
                'initial' => 'س',
                'field' => 'قانون المقاولات',
                'field_key' => 'الأعمال',
                'city' => 'طنجة',
                'rating' => 4,
                'reviews' => 112,
                'tags' => ['المقاول الذاتي', 'الضرائب', 'العقود'],
                'price' => 480,
                'available' => true,
                'avatar_color' => '#b45309',
                'latitude' => 35.7595,
                'longitude' => -5.8340,
            ],
            [
                'name' => 'كريم التازي',
                'email' => 'karim@example.com',
                'initial' => 'ك',
                'field' => 'القانون الجنائي',
                'field_key' => 'الجنائي',
                'city' => 'فاس',
                'rating' => 5,
                'reviews' => 74,
                'tags' => ['الدفاع', 'الطعون', 'الاستئناف'],
                'price' => 600,
                'available' => true,
                'avatar_color' => '#9d174d',
                'latitude' => 34.0181,
                'longitude' => -5.0078,
            ],
            [
                'name' => 'نجوى بنسالم',
                'email' => 'najwa@example.com',
                'initial' => 'ن',
                'field' => 'قانون العقار',
                'field_key' => 'العقار',
                'city' => 'مراكش',
                'rating' => 4,
                'reviews' => 156,
                'tags' => ['التسجيل', 'النزاعات', 'الكراء'],
                'price' => 450,
                'available' => true,
                'avatar_color' => '#0f766e',
                'latitude' => 31.6295,
                'longitude' => -7.9811,
            ],
            [
                'name' => 'محمد الراوي',
                'email' => 'mohammed.erraoui@example.com',
                'initial' => 'م',
                'field' => 'قانون الأسرة والأعمال',
                'field_key' => 'الأسرة',
                'city' => 'الدار البيضاء',
                'rating' => 5,
                'reviews' => 186,
                'tags' => ['الطلاق', 'النفقة', 'العقود'],
                'price' => 380,
                'available' => true,
                'avatar_color' => '#854d0e',
                'latitude' => 33.5850,
                'longitude' => -7.5650,
            ],
        ];

        foreach ($lawyerData as $l) {
            $user = User::create([
                'name' => $l['name'],
                'email' => $l['email'],
                'password' => Hash::make('password'),
                'role' => 'lawyer',
                'phone' => '0600000000',
                'address' => $l['city'] . '، المغرب',
                'is_premium' => true, // Lawyers are premium by default here
            ]);

            Lawyer::create([
                'user_id' => $user->id,
                'name' => $l['name'],
                'initial' => $l['initial'],
                'field' => $l['field'],
                'field_key' => $l['field_key'],
                'city' => $l['city'],
                'rating' => $l['rating'],
                'reviews' => $l['reviews'],
                'tags' => $l['tags'],
                'price' => $l['price'],
                'available' => $l['available'],
                'avatar_color' => $l['avatar_color'],
                'latitude' => $l['latitude'],
                'longitude' => $l['longitude'],
                'verification_status' => 'approved',
            ]);
        }

        // 4. Create default admin account
        User::create([
            'name' => 'المدير العام',
            'email' => 'admin@haqqima.com',
            'password' => Hash::make('Admin@Haqqi2026'),
            'role' => 'admin',
            'phone' => '0699887766',
            'address' => 'الدار البيضاء، المغرب',
            'is_premium' => true,
        ]);
    }
}
