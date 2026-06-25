# Cloud Deployment Guide / دليل الرفع والاستضافة أونلاين

This guide explains how to host your project on **Render.com** for free using the Docker setup.

هذا الدليل يشرح كيفية رفع واستضافة مشروعك بالكامل على منصة **Render.com** مجاناً باستخدام إعداد Docker.

---

## Arabic / باللغة العربية

### خطوات الرفع على Render (مجاناً 100%)

1. **إنشاء حساب:**
   اذهب إلى [Render.com](https://render.com) وأنشئ حساباً مجانياً (يفضل تسجيل الدخول عبر حسابك في GitHub).

2. **إنشاء خدمة ويب جديدة (New Web Service):**
   * في لوحة التحكم (Dashboard)، اضغط على زر **New +** ثم اختر **Web Service**.

3. **ربط مستودع GitHub:**
   * قم بربط حساب GitHub الخاص بك بـ Render.
   * اختر المستودع الخاص بالمشروع: `mohammedjfjbfrgjhbg/projectsoutnenace`.

4. **إعدادات الخدمة:**
   * **Name (الاسم):** اختر اسماً لمشروعك (مثال: `haqqi-law-app`).
   * **Region (المنطقة):** اختر أقرب منطقة (مثال: `Frankfurt` في أوروبا).
   * **Branch:** اختر الفرع الرئيسي `main`.
   * **Root Directory:** اتركه فارغاً.
   * **Runtime (بيئة التشغيل):** اختر **Docker** (مهم جداً! حيت ملف Dockerfile كاين في المجلد الرئيسي).
   * **Instance Type (نوع الاستضافة):** اختر الخيار المجاني **Free**.

5. **البدء في الرفع:**
   * اضغط على زر **Create Web Service** (إنشاء الخدمة).

6. **اكتمال التشغيل:**
   * سيقوم Render ببناء الحاوية (Docker container) وتثبيت جميع المكتبات تلقائياً.
   * عند الانتهاء بنجاح، سيظهر لك رابط أونلاين مجاني مثل: `https://haqqi-law-app.onrender.com`.
   * افتح الرابط واستمتع بمشروعك شغال 100% على الإنترنت!

---
---

## French / En Français

### Étapes de déploiement sur Render (100% Gratuit)

1. **Créer un compte :**
   Allez sur [Render.com](https://render.com) et créez un compte gratuit (de préférence en utilisant votre compte GitHub).

2. **Créer un nouveau service Web (New Web Service) :**
   * Dans votre tableau de bord Render, cliquez sur **New +** puis sélectionnez **Web Service**.

3. **Connecter le dépôt GitHub :**
   * Connectez votre compte GitHub et sélectionnez le dépôt de votre projet : `mohammedjfjbfrgjhbg/projectsoutnenace`.

4. **Configurer le service :**
   * **Name :** Donnez un nom à votre application (ex: `haqqi-law-app`).
   * **Region :** Choisissez la région la plus proche (ex: `Frankfurt`).
   * **Branch :** Sélectionnez la branche principale `main`.
   * **Root Directory :** Laissez ce champ vide.
   * **Runtime :** Sélectionnez **Docker** (très important !).
   * **Instance Type :** Choisissez le plan gratuit **Free**.

5. **Lancer le déploiement :**
   * Cliquez sur **Create Web Service** en bas de la page.

6. **Accéder à l'application :**
   * Render va construire automatiquement l'image Docker du projet et démarrer les serveurs.
   * Une fois le déploiement réussi, Render vous fournira une URL publique gratuite (ex: `https://haqqi-law-app.onrender.com`).
