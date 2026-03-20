#!/bin/bash
# 在服务器上执行此脚本
cd /opt/puzzle-game
npm install --production
npm install -g pm2
pm2 delete puzzle-game 2>/dev/null
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "✅ 拼图游戏已启动在端口 3000"
