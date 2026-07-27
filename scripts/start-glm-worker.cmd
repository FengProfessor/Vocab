@echo off
REM Usage: start-glm-worker.cmd 0 3
REM shard index / count
set SHARD=%1
set COUNT=%2
if "%SHARD%"=="" set SHARD=0
if "%COUNT%"=="" set COUNT=3

cd /d D:\Vibe\Vocab\web-app
if not exist scripts\logs mkdir scripts\logs
set LOG=scripts\logs\forever-w%SHARD%.log
title GLM-W%SHARD%

echo ===== worker shard %SHARD%/%COUNT% start %date% %time% =====>> %LOG%

:loop
echo.>> %LOG%
echo ===== loop %date% %time% =====>> %LOG%
call npx tsx scripts/backfill-core-senses-glm.ts --forever --limit=120 --delay=250 --shard=%SHARD%/%COUNT% >> %LOG% 2>&1
set EC=%ERRORLEVEL%
echo exitcode=%EC% %time%>> %LOG%

if %EC%==42 (
  echo QUOTA exit %time%>> %LOG%
  exit /b 42
)
if %EC%==0 (
  echo DONE no pending %time%>> %LOG%
  timeout /t 60 /nobreak >nul
  goto loop
)

echo crash/restart in 15s ec=%EC%>> %LOG%
timeout /t 15 /nobreak >nul
goto loop
