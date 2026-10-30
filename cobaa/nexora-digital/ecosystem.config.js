module.exports = {
  apps: [
    {
      name: 'nexora-api',
      cwd: '/var/www/nexora/backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
    {
      name: 'nexora-worker',
      cwd: '/var/www/nexora/backend',
      script: 'dist/worker.js',
      instances: 1,
      autorestart: true,
      env: { NODE_ENV: 'production' },
    },
  ],
};
