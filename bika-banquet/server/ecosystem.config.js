module.exports = {
  apps: [
    {
      name: 'bika-banquet-server',
      script: 'dist/server.js',
      exec_mode: 'cluster',
      instances: 'max',
      max_memory_restart: '512M',
    },
  ],
};
