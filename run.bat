@echo off
setlocal enabledelayedexpansion
title Audio Extractor — Launcher

:: ─────────────────────────────────────────────────────────────────────────
::  CONFIGURATION  (edit these if paths change)
:: ─────────────────────────────────────────────────────────────────────────
set "ROOT=%~dp0"
set "BACKEND=%ROOT%audio-extractor"
set "FRONTEND=%ROOT%frontend"
set "JAVA_HOME=C:\Program Files\JetBrains\IntelliJ IDEA 2024.2.3\jbr"
set "PG_BIN=C:\Program Files\PostgreSQL\17\bin"

:: ─────────────────────────────────────────────────────────────────────────
cls
echo.
echo   ##############################################
echo   #                                            #
echo   #       AUDIO EXTRACTOR  --  LAUNCHER        #
echo   #                                            #
echo   ##############################################
echo.

:: ─────────────────────────────────────────────────────────────────────────
::  STEP 1 — PostgreSQL
:: ─────────────────────────────────────────────────────────────────────────
echo   [1/3] PostgreSQL
netstat -an 2>nul | findstr /C:":5432" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo         Already running on :5432  OK
    goto :pg_done
)

echo         Not running — trying to start Windows service...
for %%S in (postgresql-x64-17 postgresql-x64-16 postgresql-x64-15 postgresql-x64-13 postgresql) do (
    net start %%S >nul 2>&1
    if !errorlevel!==0 (
        echo         Service "%%S" started  OK
        goto :pg_done
    )
)

echo         Could not auto-start PostgreSQL.
echo         Please open Services (services.msc) and start it manually,
echo         then press any key to continue.
pause >nul

:pg_done
echo.

:: ─────────────────────────────────────────────────────────────────────────
::  STEP 2 — Spring Boot backend
:: ─────────────────────────────────────────────────────────────────────────
echo   [2/3] Spring Boot backend
netstat -an 2>nul | findstr /C:":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo         Already running on :8080  OK
    goto :backend_done
)

echo         Opening backend window...
start "Backend -- Spring Boot :8080" cmd /k "set JAVA_HOME=%JAVA_HOME%&& set PATH=%JAVA_HOME%\bin;%PG_BIN%;%PATH%&& cd /d "%BACKEND%"&& echo.&& echo  [Backend] Starting Spring Boot ...&& echo.&& mvnw.cmd spring-boot:run"

echo         Waiting for :8080 to come up (this takes ~15 seconds)...
:wait_backend
timeout /t 2 /nobreak >nul
netstat -an 2>nul | findstr /C:":8080" | findstr "LISTENING" >nul
if !errorlevel! neq 0 goto :wait_backend
echo         Backend ready on :8080  OK

:backend_done
echo.

:: ─────────────────────────────────────────────────────────────────────────
::  STEP 3 — Vite frontend
:: ─────────────────────────────────────────────────────────────────────────
echo   [3/3] Vite frontend
netstat -an 2>nul | findstr /C:":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo         Already running on :5173  OK
    goto :frontend_done
)

echo         Opening frontend window...
start "Frontend -- Vite :5173" cmd /k "cd /d "%FRONTEND%"&& echo.&& echo  [Frontend] Starting Vite ...&& echo.&& npm run dev"

echo         Waiting for :5173 to come up...
:wait_frontend
timeout /t 2 /nobreak >nul
netstat -an 2>nul | findstr /C:":5173" | findstr "LISTENING" >nul
if !errorlevel! neq 0 goto :wait_frontend
echo         Frontend ready on :5173  OK

:frontend_done
echo.

:: ─────────────────────────────────────────────────────────────────────────
::  DONE
:: ─────────────────────────────────────────────────────────────────────────
echo   ##############################################
echo   #                                            #
echo   #   All services are running!                #
echo   #                                            #
echo   #   App  ->  http://localhost:5173           #
echo   #   API  ->  http://localhost:8080/api       #
echo   #   DB   ->  localhost:5432 / vezilka        #
echo   #                                            #
echo   ##############################################
echo.
echo   Opening browser...
start "" "http://localhost:5173"
echo.
echo   This launcher window can now be closed.
echo   The Backend and Frontend windows will keep running.
echo.
pause
endlocal
