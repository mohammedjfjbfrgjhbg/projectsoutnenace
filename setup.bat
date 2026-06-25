@echo off
title Project Setup Assistant
echo ===================================================
echo             PROJECT SETUP ASSISTANT
echo         Assistant d'installation du Projet
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install it from https://nodejs.org/
    echo [ERREUR] Node.js n'est pas installe! Veuillez l'installer depuis https://nodejs.org/
    pause
    exit /b 1
)

:: Check for PHP
where php >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not installed! Please install PHP and add it to your PATH environment variable.
    echo [ERREUR] PHP n'est pas installe! Veuillez l'installer et l'ajouter au PATH.
    pause
    exit /b 1
)

:: Check for Composer
where composer >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Composer is not installed! Please install it from https://getcomposer.org/
    echo [ERREUR] Composer n'est pas installe! Veuillez l'installer depuis https://getcomposer.org/
    pause
    exit /b 1
)

echo [1/5] Configuring Backend Environment...
cd /d "%~dp0projet-de-synthese-soutnence\backend"
if not exist ".env" (
    echo Copying .env.example to .env...
    copy ".env.example" ".env" >nul
) else (
    echo .env file already exists. Skipping copy.
)

echo.
echo [2/5] Installing Backend dependencies (Composer)...
call composer install
if %errorlevel% neq 0 (
    echo [ERROR] Composer install failed.
    pause
    exit /b 1
)

echo.
echo [3/5] Setting up database and keys...
:: Ensure SQLite database exists
if not exist "database\database.sqlite" (
    echo Creating SQLite database file...
    type nul > "database\database.sqlite"
)

:: Generate App key
echo Generating Application Key...
call php artisan key:generate

:: Run migrations and seed the database
echo Running database migrations and seeding data...
call php artisan migrate:fresh --seed
if %errorlevel% neq 0 (
    echo [WARNING] Database migration failed. Make sure PHP has the sqlite3 extension enabled in php.ini.
    pause
)

echo.
echo [4/5] Installing Frontend dependencies (npm)...
cd /d "%~dp0projet-de-synthese-soutnence\front-end"
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [5/5] Setup Completed Successfully!
echo ===================================================
echo All dependencies are installed and configured.
echo SQLite database is ready (No XAMPP or MySQL needed!).
echo.
echo To run the project, double-click "start.bat" in the root directory.
echo Pour lancer le projet, double-cliquez sur "start.bat" a la racine.
echo ===================================================
echo.
pause
