#!/bin/bash
node backend/index.js &
cd frontend/front-end && npm run dev
