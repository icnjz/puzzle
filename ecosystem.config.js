module.exports = {
  apps: [{
    name: 'puzzle-game',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3333
    }
  }]
};
