<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث بشأن طلب انضمامك</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 0;
            direction: rtl;
            text-align: right;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #1e293b;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #ef4444;
            font-size: 28px;
            margin: 0;
            font-weight: 700;
        }
        .logo p {
            color: #94a3b8;
            margin: 5px 0 0 0;
            font-size: 14px;
        }
        h2 {
            color: #f8fafc;
            font-size: 22px;
            margin-bottom: 20px;
            border-bottom: 2px solid #334155;
            padding-bottom: 10px;
        }
        p {
            line-height: 1.6;
            color: #cbd5e1;
            font-size: 16px;
        }
        .rejection-box {
            background-color: #7f1d1d;
            border: 1px solid #b91c1c;
            padding: 15px;
            border-radius: 8px;
            color: #fecaca;
            margin: 20px 0;
            font-size: 15px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #334155;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>حكميما | Haqqima</h1>
            <p>منصة المحامين والتحقق الرقمي</p>
        </div>
        <h2>مرحباً الأستاذ(ة) {{ $name }}</h2>
        <p>نشكرك على اهتمامك بالانضمام إلى منصة <strong>حكميما</strong>.</p>
        <p>بعد مراجعة وتدقيق المستندات التي قمت بتقديمها للتحقق من هويتك وصفتك المهنية، نأسف لإبلاغك بأنه قد تم <strong>رفض</strong> طلبك للسبب التالي:</p>
        <div class="rejection-box">
            <strong>سبب الرفض:</strong><br>
            {{ $reason }}
        </div>
        <p>يمكنك تعديل معلوماتك وإعادة تحميل الوثائق الصحيحة عبر تسجيل الدخول لحسابك وإعادة التقديم.</p>
        <div class="footer">
            <p>هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.</p>
            <p>&copy; {{ date('Y') }} حكميما. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>
