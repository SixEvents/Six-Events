@echo off
echo ========================================
echo   SIX EVENTS - EMAIL SERVICE
echo ========================================
echo.
echo Este script vai processar emails da fila
echo Mantenha esta janela ABERTA
echo.
echo Pressione CTRL+C para parar
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale Node.js de: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se .env existe
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo.
    echo Crie o arquivo .env com:
    echo VITE_SUPABASE_URL=https://rzcdcwwdlnczojmslhax.supabase.co
    echo SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
    echo GMAIL_USER=6events.mjt@gmail.com
    echo GMAIL_APP_PASSWORD=sua_senha_app
    echo EMAIL_FROM=6events.mjt@gmail.com
    echo EMAIL_FROM_NAME=Six Events
    echo.
    pause
    exit /b 1
)

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Rodar o serviço
echo.
echo Iniciando Email Service...
echo.
call npm start
