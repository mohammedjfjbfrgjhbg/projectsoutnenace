<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تأكيد استلام طلب التسجيل</title>
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
            color: #38bdf8;
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
        <h2>أهلاً بك، الأستاذ(ة) {{ $name }}</h2>
        <p>نشكرك على تقديم طلبك للانضمام إلى منصة <strong>حكميما</strong> كمحامٍ معتمد.</p>
        <p>لقد تم استلام ملف التحقق (KYC) الخاص بك بنجاح، وهو الآن قيد المراجعة والتدقيق من قبل فريق الإدارة لدينا.</p>
        <p>سيتم التحقق من الوثائق والهوية المهنية التي قمت بإرسالها خلال <strong>48 ساعة عمل</strong>. سنقوم بإشعارك عبر البريد الإلكتروني فور تحديث حالة طلبك.</p>
        <p>إذا كانت لديك أي استفسارات، يمكنك التواصل معنا عبر هذا البريد الإلكتروني.</p>
        <div class="footer">
            <p>هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.</p>
            <p>&copy; {{ date('Y') }} حكميما. جميع الحقوق محفوظة.</p>
        </div>
    </div>
</body>
</html>
