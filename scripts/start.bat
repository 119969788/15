@echo off
REM 15分钟市场套利程序启动脚本 (Windows)

echo 🚀 启动15分钟市场套利程序...

REM 检查.env文件
if not exist .env (
    echo ⚠️  未找到.env文件，请先配置环境变量
    echo 参考.env.example创建.env文件
    pause
    exit /b 1
)

REM 检查node_modules
if not exist node_modules (
    echo 📦 安装依赖...
    call npm install
)

REM 运行程序
echo ▶️  运行程序...
call npm run dev

pause
