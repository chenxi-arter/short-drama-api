module.exports = {
  apps: [
    {
      name: 'short-drama-api',   // pm2 ls 里看到的名字
      script: 'dist/src/main.js',    // build 后的入口
      cwd: '/home/deploy/workspace/short-drama-api',
      instances: 'max',          // 核数满额多进程，可改成 1
      exec_mode: 'cluster',      // 负载均衡模式（单实例可改 fork）
      env: {
        NODE_ENV: 'production',
        PORT: 3001              // 你的 Nest 监听端口
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      max_memory_restart: '1G'   // 内存重启阈值
    }
  ]
};