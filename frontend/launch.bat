@echo off
echo --- Starting Sentinel Threat Defense System ---

:: Check if backend folder exists
if not exist backend (
    echo [ERROR] Backend folder not found!
    pause
    exit
)

echo Starting Python Backend...
start "Sentinel_Backend" cmd /k "cd backend && python main.py"

echo Starting React Frontend...
start "Sentinel_Frontend" cmd /k "npm run dev"

echo --- All processes initiated ---
pause