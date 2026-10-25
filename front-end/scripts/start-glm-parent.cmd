@echo off
cd /d D:\Vibe\Vocab\web-app
if not exist scripts\logs mkdir scripts\logs
title GLM-PARENT-DO-NOT-CLOSE
echo.
echo ============================================
echo  GLM burn parent - DO NOT CLOSE THIS WINDOW
echo  Minimize OK. PC should stay awake.
echo  Log: scripts\logs\parent.log
echo  Workers: scripts\logs\forever-w0/1/2.log
echo ============================================
echo.
node scripts\glm-burn-parent.mjs
echo.
echo Parent exited. Press any key to close.
pause
