@echo off
cd /d D:\Projects\CertEx\certex-web-app\backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
