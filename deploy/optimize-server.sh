#!/usr/bin/env bash
# ==============================================================================
# Script Tối Ưu Hóa Tiến Trình Node.js Standalone & Systemd (LingoPro Self-Host)
# ==============================================================================
set -euo pipefail

echo "🚀 [Optimize-Server] Đang tối ưu hóa cấu hình dịch vụ lingopro.service..."

SERVICE_FILE="/etc/systemd/system/lingopro.service"

if [ ! -f "$SERVICE_FILE" ]; then
  echo "⚠️ Tệp dịch vụ $SERVICE_FILE chưa tồn tại. Đang tạo mới dịch vụ chuẩn..."
  sudo bash -c "cat << 'EOF' > $SERVICE_FILE
[Unit]
Description=LingoPro Next.js Standalone Web App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Vocab/web-app/.next/standalone
ExecStart=/usr/bin/node --max-old-space-size=2048 server.js
Restart=always
RestartSec=3s
Environment=NODE_ENV=production
Environment=PORT=3000
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF"
else
  echo "🔧 Cập nhật các thông số tối ưu RAM (--max-old-space-size=2048) và RestartSec..."
  if ! grep -q "max-old-space-size" "$SERVICE_FILE"; then
    sudo sed -i 's|ExecStart=/usr/bin/node server.js|ExecStart=/usr/bin/node --max-old-space-size=2048 server.js|g' "$SERVICE_FILE" || true
  fi
fi

sudo systemctl daemon-reload
sudo systemctl restart lingopro.service

echo "✅ [Optimize-Server] Đã tối ưu hóa dịch vụ lingopro.service thành công!"
