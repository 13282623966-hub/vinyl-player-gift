@echo off
chcp 65001 >nul
title 用浏览器打开此页面
echo 正在启动，浏览器即将自动打开...
start "" http://localhost:8080
python -m http.server 8080