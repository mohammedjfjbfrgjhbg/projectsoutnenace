# Haqqi / Projectsoutnenace - Installation & Setup Guide / دليل التثبيت والإعداد

## Arabic / باللغة العربية

هذا الدليل يشرح كيفية إعداد وتشغيل المشروع بالكامل (الواجهة الأمامية والخلفية وسيرفر السوكت) على جهاز جديد.

### 1. المتطلبات الأساسية
تأكد من تثبيت البرامج التالية على جهازك:
* **Node.js** (لتشغيل الـ Frontend وسيرفر الـ Socket).
* **PHP** و **Composer** (لتشغيل الـ Backend - Laravel).
* **XAMPP** أو **WampServer** (لتشغيل سيرفر MySQL وقاعدة البيانات).

---

### 2. خطوات تثبيت الواجهة الخلفية (Backend)
افتح واجهة الأوامر (Terminal) في مجلد `projet-de-synthese-soutnence/backend` ونفذ ما يلي:

1. **تثبيت مكتبات PHP:**
   ```bash
   composer install
   ```
2. **إنشاء ملف الإعدادات البيئية:**
   قم بنسخ ملف `.env.example` وتسميته بـ `.env`:
   ```bash
   copy .env.example .env
   ```
3. **توليد مفتاح أمان التطبيق:**
   ```bash
   php artisan key:generate
   ```
4. **تهيئة قاعدة البيانات:**
   - افتح لوحة تحكم XAMPP وشغّل سيرفر Apache و MySQL.
   - اذهب إلى الرابط `http://localhost/phpmyadmin` وأنشئ قاعدة بيانات جديدة فارغة باسم `projectsoutnenace`.
   - افتح ملف `.env` وقم بتعديل إعدادات قاعدة البيانات لتتطابق مع جهازك:
     ```env
     DB_DATABASE=projectsoutnenace
     DB_USERNAME=root
     DB_PASSWORD=
     ```
5. **تصدير الجداول وإدخال البيانات الافتراضية:**
   ```bash
   php artisan migrate --seed
   ```

---

### 3. خطوات تثبيت الواجهة الأمامية (Frontend)
افتح واجهة الأوامر (Terminal) في مجلد `projet-de-synthese-soutnence/front-end` ونفذ ما يلي:

1. **تثبيت مكتبات الـ JavaScript:**
   ```bash
   npm install
   ```

---

### 4. تشغيل المشروع (بضغطة زر واحدة)
بعد إكمال التثبيت، اذهب إلى مجلد المشروع الرئيسي واضغط مرتين (Double Click) على ملف:
**`start.bat`**

سيقوم هذا الملف ببدء تشغيل السيرفرات الثلاثة تلقائياً وسيعمل الموقع على الرابط: `http://localhost:5173`.

---
---

## French / En Français

Ce guide explique comment installer et exécuter l'ensemble du projet (Frontend, Backend et Serveur Socket) sur une nouvelle machine.

### 1. Prérequis
Assurez-vous d'avoir installé les logiciels suivants :
* **Node.js** (pour le Frontend et le serveur Socket).
* **PHP** & **Composer** (pour le Backend Laravel).
* **XAMPP** ou **WampServer** (pour le serveur MySQL).

---

### 2. Configuration du Backend (Laravel)
Ouvrez votre terminal dans le dossier `projet-de-synthese-soutnence/backend` et exécutez :

1. **Installer les dépendances PHP :**
   ```bash
   composer install
   ```
2. **Créer le fichier de configuration `.env` :**
   Copiez le fichier `.env.example` et nommez-le `.env` :
   ```bash
   copy .env.example .env
   ```
3. **Générer la clé de l'application :**
   ```bash
   php artisan key:generate
   ```
4. **Créer la base de données :**
   - Lancez Apache et MySQL depuis XAMPP.
   - Allez sur `http://localhost/phpmyadmin` et créez une base de données vide nommée `projectsoutnenace`.
   - Configurez vos identifiants de base de données dans le fichier `.env` :
     ```env
     DB_DATABASE=projectsoutnenace
     DB_USERNAME=root
     DB_PASSWORD=
     ```
5. **Exécuter les migrations et insérer les fausses données :**
   ```bash
   php artisan migrate --seed
   ```

---

### 3. Configuration du Frontend (React / Vite)
Ouvrez votre terminal dans le dossier `projet-de-synthese-soutnence/front-end` et exécutez :

1. **Installer les dépendances JS :**
   ```bash
   npm install
   ```

---

### 4. Lancement du Projet
Une fois l'installation terminée, allez dans le dossier racine du projet et double-cliquez sur le fichier :
**`start.bat`**

Cela démarrera automatiquement le serveur Socket, le serveur Laravel et le serveur de développement Vite. L'application sera accessible sur `http://localhost:5173`.
