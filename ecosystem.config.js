module.exports = {
  apps: [{
    name: '15min-arbitrage',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 如果程序崩溃，等待10秒后重启
    min_uptime: '10s',
    // 最多重启10次，如果10次内无法稳定运行，停止重启
    max_restarts: 10,
    // 重启间隔
    restart_delay: 4000
  }]
};
