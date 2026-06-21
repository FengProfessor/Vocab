@echo off
REM Mo 4 cua so Chrome rieng (profile + debug port) cho auto-chrome-bot.
REM Lan dau: login Google (moi cua so 1 nick khac nhau) + de yen o trang aistudio chat.
REM Sau do chay: npx tsx scripts/auto-chrome-bot.ts --ports=9222,9223,9224,9225

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "BASE=%~dp0.chrome-bot-profiles"
set "URL=https://aistudio.google.com/prompts/new_chat"

echo Mo 4 Chrome (port 9222-9225)...
start "" "%CHROME%" --user-data-dir="%BASE%\p0" --remote-debugging-port=9222 --no-first-run --no-default-browser-check "%URL%"
start "" "%CHROME%" --user-data-dir="%BASE%\p1" --remote-debugging-port=9223 --no-first-run --no-default-browser-check "%URL%"
start "" "%CHROME%" --user-data-dir="%BASE%\p2" --remote-debugging-port=9224 --no-first-run --no-default-browser-check "%URL%"
start "" "%CHROME%" --user-data-dir="%BASE%\p3" --remote-debugging-port=9225 --no-first-run --no-default-browser-check "%URL%"

echo.
echo Da mo. Lan dau hay login Google + mo 1 chat aistudio o moi cua so.
echo Roi chay: npx tsx scripts/auto-chrome-bot.ts --ports=9222,9223,9224,9225
