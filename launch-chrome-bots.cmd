@echo off
REM Mo 1 Chrome profile "ta phong" (Profile 1) voi 8 tab aistudio, moi tab 1 nick (/u/0../u/7).
REM QUAN TRONG: DONG HET Chrome dang mo truoc khi chay (neu khong se khong bat duoc debug port).
REM Sau do chay: npx tsx scripts/auto-chrome-bot.ts --ports=9222

echo Dang tat triet de cac tien trinh Chrome dang chay ngam...
taskkill /f /im chrome.exe >nul 2>&1
ping -n 3 127.0.0.1 >nul

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "UD=%LOCALAPPDATA%\Google\Chrome\User Data"
set "AS=https://aistudio.google.com"

echo Dong het Chrome truoc! Dang mo Profile 1 (ta phong) + 8 tab nick...
start "" "%CHROME%" --user-data-dir="%UD%" --profile-directory="Profile 1" --remote-debugging-port=9222 --no-first-run --no-default-browser-check ^
  "%AS%/u/0/prompts/new_chat" "%AS%/u/1/prompts/new_chat" "%AS%/u/2/prompts/new_chat" "%AS%/u/3/prompts/new_chat" ^
  "%AS%/u/4/prompts/new_chat" "%AS%/u/5/prompts/new_chat" "%AS%/u/6/prompts/new_chat" "%AS%/u/7/prompts/new_chat"

echo.
echo Da mo 8 tab (u0..u7 = 8 nick). Kiem tra moi tab dung 1 chat aistudio.
echo Roi chay: npx tsx scripts/auto-chrome-bot.ts --ports=9222
