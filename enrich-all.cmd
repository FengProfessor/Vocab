@echo off
REM Tu dong enrich toan bo global_dictionary (audio + family + synonyms/antonyms)
REM Tu lap toi khi xong, nghi khi quota can. Double-click de chay.
cd /d "%~dp0"
echo === LingoPro enrich-all (tu dong, --loop) ===
npx tsx scripts/enrich-all.ts --loop --conc=4
echo.
echo === DONE. Nhan phim de dong. ===
pause
