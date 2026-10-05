@echo off
title ChaosLauncher - Launcher Scripts
echo ========================================================
echo   Iniciando Backend y Frontend de ChaosLauncher
echo ========================================================
echo.

start "ChaosLauncher Backend (NestJS :3000)" cmd /k "cd /d %~dp0ChaosLauncher-Backend && npm run start:dev"
start "ChaosLauncher Frontend (Next.js :3001)" cmd /k "cd /d %~dp0ChaosLauncher-Front && npm run dev"

echo Ambos servicios han sido lanzados en terminales independientes:
echo  - Backend:  http://localhost:3000 (Swagger: http://localhost:3000/docs)
echo  - Frontend: http://localhost:3001
echo.
pause
