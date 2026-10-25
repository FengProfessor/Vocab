@echo off
setlocal
cd /d D:\Vibe\Vocab\web-app
set LOGDIR=scripts\logs
if not exist %LOGDIR% mkdir %LOGDIR%
set STAMP=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set STAMP=%STAMP: =0%
set LOG=%LOGDIR%\forever-%STAMP%.log

echo START %DATE% %TIME% > %LOG%

:loop
echo. >> %LOG%
echo === BATCH %DATE% %TIME% === >> %LOG%
call npx tsx scripts/backfill-core-senses-glm.ts --limit=300 --delay=200 >> %LOG% 2>&1
set EC=%ERRORLEVEL%
echo EXITCODE=%EC% >> %LOG%

findstr /C:"Done: ok=0 skip=" %LOG% >nul
rem keep going regardless; stop only on auth/quota markers
findstr /I /C:"401" /C:"Unauthorized" /C:"余额" /C:"insufficient" /C:"quota" /C:"code\":429" %LOG% >nul
if %ERRORLEVEL%==0 (
  echo STOP quota/auth detected >> %LOG%
  goto end
)

rem count last Done line ok
powershell -NoProfile -Command "$t=Get-Content '%LOG%' -Raw; if($t -match '(?s).*Done: ok=(\d+) skip=(\d+) fail=(\d+)'){ $ok=[int]$Matches[1]; $fail=[int]$Matches[3]; if($ok -eq 0 -and $fail -eq 0){ exit 2 } elseif($ok -eq 0 -and $fail -gt 50){ exit 3 } else { exit 0 } } else { exit 0 }"
if %ERRORLEVEL%==2 (
  echo STOP no pending >> %LOG%
  goto end
)
if %ERRORLEVEL%==3 (
  echo cooldown 90s high fail >> %LOG%
  timeout /t 90 /nobreak >nul
)

timeout /t 5 /nobreak >nul
goto loop

:end
echo END %DATE% %TIME% >> %LOG%
