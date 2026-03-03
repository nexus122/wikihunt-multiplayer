#!/bin/bash
# Start Wikihunt (backend + frontend)
echo "Starting Wikihunt..."

cd "$(dirname "$0")/backend" && npm run dev &
BACKEND_PID=$!

cd "$(dirname "$0")/frontend" && npx ng serve &
FRONTEND_PID=$!

echo ""
echo "  Backend  → http://localhost:3001"
echo "  Frontend → http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop all."

wait
