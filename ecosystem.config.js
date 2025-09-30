// PM2 进程管理配置
// 用途：在生产环境分别以独立进程运行“客户端 API”和“管理端 API”，并配置日志、内存重启等参数。
// 关键点：
// - script 指向各自构建后的入口文件
// - instances/exec_mode 控制多进程与调度模式
// - env 中使用 CLIENT_PORT/ADMIN_PORT 指定端口（与应用入口 main.client.ts / main.admin.ts 对应）
// - 日志统一写入 ./logs 目录，便于采集与排查

module.exports = {
  apps: [
    {
      // 客户端 API 进程
      name: 'short-drama-client-api',
      script: 'dist/src/main.client.js', // 客户端入口（仅对外 API）
      cwd: '/home/deploy/workspace/short-drama-api', // 进程工作目录（可按部署路径调整）
      instances: '1', // 进程数量；多核可设为 'max' 或具体数字
      exec_mode: 'cluster', // cluster=负载均衡；单实例可改为 'fork'
      env: {
        NODE_ENV: 'production',
        CLIENT_PORT: 8080 // 客户端 API 监听端口（main.client.ts 读取）
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      log_file: './logs/combined.log', // 合并日志
      out_file: './logs/out.log', // 标准输出
      error_file: './logs/error.log', // 错误输出
      merge_logs: true,
      max_memory_restart: '1G' // 达到阈值自动重启，防止内存泄漏
    },
    {
      // 管理端 API 进程
      name: 'short-drama-admin-api',
      script: 'dist/src/main.admin.js', // 管理端入口（/api/admin/*）
      cwd: '/home/deploy/workspace/short-drama-api',
      instances: '1',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 9090 // 管理端 API 监听端口（main.admin.ts 读取）
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