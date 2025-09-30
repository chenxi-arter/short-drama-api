module.exports = {
  apps: [
    {
      name: 'short-drama-client-api',
      script: 'dist/src/main.client.js',
      cwd: '/home/deploy/workspace/short-drama-api',
      instances: '1',          // 核数满额多进程，可改成 1
      exec_mode: 'cluster',      // 负载均衡模式（单实例可改 fork）
      env: {
        NODE_ENV: 'production',
        PORT: 3000              // 客户端 API 端口
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      max_memory_restart: '1G'   // 内存重启阈值
    },
    {
      name: 'short-drama-admin-api',
      script: 'dist/src/main.admin.js',
      cwd: '/home/deploy/workspace/short-drama-api',
      instances: '1',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8080              // 管理端 API 端口
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      max_memory_restart: '1G'
    }
  ]
};