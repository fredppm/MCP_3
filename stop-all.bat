@echo off
echo ====================================
echo     Parando todos os serviços
echo ====================================
echo.
echo Parando processos nas portas 4000+...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr ":400[0-9]" ^| findstr "LISTENING"') do (
    echo Matando processo %%i
    taskkill /f /pid %%i 2>nul
)

echo.
echo Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo ====================================
echo   Todos os serviços foram parados!
echo ====================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul