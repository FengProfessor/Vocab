@echo off
REM Durable GLM burn - 3 forever workers (shard 0/1/2)
REM Chay file nay 1 lan, de 3 cua so cmd MINIMIZED mo.

cd /d D:\Vibe\Vocab\web-app
if not exist scripts\logs mkdir scripts\logs

for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set D=%%c%%a%%b
set T=%time::=%
set T=%T: =0%
set STAMP=%D%-%T:~0,6%

echo Starting durable workers stamp=%STAMP%

start "GLM-W0" /MIN cmd /k "cd /d D:\Vibe\Vocab\web-app && set GLM_BACKFILL_LOG=scripts\logs\forever-w0.log && title GLM-W0 && :loop && echo ===== restart %time% =====>> scripts\logs\forever-w0.log && npx tsx scripts/backfill-core-senses-glm.ts --forever --limit=120 --delay=250 --shard=0/3 >> scripts\logs\forever-w0.log 2>&1 && if errorlevel 42 (echo QUOTA>>scripts\logs\forever-w0.log & exit /b 42) && timeout /t 10 /nobreak >nul && goto loop"

timeout /t 4 /nobreak >nul

start "GLM-W1" /MIN cmd /k "cd /d D:\Vibe\Vocab\web-app && set GLM_BACKFILL_LOG=scripts\logs\forever-w1.log && title GLM-W1 && :loop && echo ===== restart %time% =====>> scripts\logs\forever-w1.log && npx tsx scripts/backfill-core-senses-glm.ts --forever --limit=120 --delay=250 --shard=1/3 >> scripts\logs\forever-w1.log 2>&1 && if errorlevel 42 (echo QUOTA>>scripts\logs\forever-w1.log & exit /b 42) && timeout /t 10 /nobreak >nul && goto loop"

timeout /t 4 /nobreak >nul

start "GLM-W2" /MIN cmd /k "cd /d D:\Vibe\Vocab\web-app && set GLM_BACKFILL_LOG=scripts\logs\forever-w2.log && title GLM-W2 && :loop && echo ===== restart %time% =====>> scripts\logs\forever-w2.log && npx tsx scripts/backfill-core-senses-glm.ts --forever --limit=120 --delay=250 --shard=2/3 >> scripts\logs\forever-w2.log 2>&1 && if errorlevel 42 (echo QUOTA>>scripts\logs\forever-w2.log & exit /b 42) && timeout /t 10 /nobreak >nul && goto loop"

echo.
echo OK - 3 workers minimized: GLM-W0 GLM-W1 GLM-W2
echo Logs: scripts\logs\forever-w0.log forever-w1.log forever-w2.log
echo Do NOT close those windows. Keep PC awake.
echo Status: npx tsx scripts/tmp-count-pending-core.ts
timeout /t 8 /nobreak >nul
