module.exports = {
  apps: [
    {
      name: 'slots-game',
      script: 'src/server.js',
      cwd: '/Users/jackruss/.openclaw/workspace/slots-game',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      log_file: '/Users/jackruss/.openclaw/workspace/slots-game/logs/combined.log',
      out_file: '/Users/jackruss/.openclaw/workspace/slots-game/logs/out.log',
      error_file: '/Users/jackruss/.openclaw/workspace/slots-game/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      restart_delay: 1000,
    },
  ],
};
