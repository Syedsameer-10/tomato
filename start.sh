#!/bin/bash
fuser -k 3001/tcp 2>/dev/null || true

nohup node backend/index.js > /tmp/backend.log 2>&1 &

echo "Waiting for backend to be ready..."
until curl -s http://localhost:3001/api/restaurants > /dev/null 2>&1; do
  sleep 1
done
echo "Backend is ready!"

cd frontend/front-end && npm run dev
