#!/bin/bash

# Chuyển về project root (nơi có main.py)
cd "$(dirname "$0")"

# Thêm tất cả file đã thay đổi
git add .

# Commit với timestamp
git commit -m "Auto-update $(date '+%Y-%m-%d %H:%M:%S')"

# Push lên GitHub
git push origin main

echo "✅ Code đã push lên GitHub. Render sẽ tự rebuild & redeploy."