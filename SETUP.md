# Haqqi / Projectsoutnenace - Installation & Setup Guide / دليل التثبيت والإعداد

## Arabic / باللغة العربية

هذا الدليل يشرح كيفية إعداد وتشغيل المشروع بالكامل **دون الحاجة لتثبيت XAMPP أو WampServer**، لأن المشروع يستخدم قاعدة بيانات **SQLite** (عبارة عن ملف محلي بسيط يتم إنشاؤه تلقائياً داخل المشروع).

---

### 1. المتطلبات الأساسية
تأكد من تثبيت البرامج التالية على جهازك:
* **Node.js** (لتشغيل الـ Frontend وسيرفر الـ Socket).
* **PHP** (تأكد من تفعيل إضافة `sqlite3` و `pdo_sqlite` في ملف `php.ini` الخاص بـ PHP).
* **Composer** (لإدارة حزم الـ PHP والواجهة الخلفية).

---

### 2. التثبيت التلقائي (بضغطة زر واحدة)
لقد قمنا بإنشاء ملف تشغيل تلقائي يقوم بتهيئة كل شيء بالنيابة عنك:

1. اذهب إلى مجلد المشروع الرئيسي.
2. اضغط مرتين (Double Click) على الملف: **`setup.bat`**.
3. سيقوم هذا الملف بـ:
   - نسخ ملف الإعدادات البيئية `.env`.
   - تثبيت مكتبات PHP عبر Composer.
   - إنشاء قاعدة بيانات SQLite وتجهيز الجداول والبيانات الافتراضية.
   - تثبيت مكتبات JavaScript للواجهة الأمامية.

---

### 3. تشغيل المشروع
بعد انتهاء ملف التثبيت بنجاح، يمكنك تشغيل المشروع في أي وقت بالضغط مرتين على:
**`start.bat`**

سيقوم هذا الملف ببدء تشغيل السيرفرات الثلاثة تلقائياً وسيعمل الموقع مباشرة على الرابط: `http://localhost:5173`.

---
---

## French / En Français

Ce guide explique comment installer et exécuter l'ensemble du projet **sans avoir besoin d'installer XAMPP ou WampServer**. Le projet utilise une base de données **SQLite** (un simple fichier local stocké dans le projet).

---

### 1. Prérequis
Assurez-vous d'avoir installé les logiciels suivants :
* **Node.js** (pour le Frontend et le serveur Socket).
* **PHP** (assurez-vous que les extensions `sqlite3` et `pdo_sqlite` sont activées dans votre `php.ini`).
* **Composer** (pour gérer les dépendances du Backend Laravel).

---

### 2. Installation Automatique (En un clic)
Nous avons créé un script d'installation automatique pour configurer le projet facilement :

1. Allez dans le dossier racine du projet.
2. Double-cliquez sur le fichier : **`setup.bat`**.
3. Ce script va automatiquement :
   - Créer le fichier de configuration `.env`.
   - Installer les dépendances PHP via Composer.
   - Créer la base de données SQLite et insérer les données initiales (seeding).
   - Installer les dépendances JavaScript du Frontend.

---

### 3. Lancement du Projet
Une fois l'installation terminée, vous pouvez lancer le projet à tout moment en double-cliquant sur le fichier :
**`start.bat`**

Cela démarrera automatiquement le serveur de socket, le backend Laravel, et le serveur de développement Vite. L'application sera accessible sur `http://localhost:5173`.
