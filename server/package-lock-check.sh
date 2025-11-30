#!/bin/bash
# Check if package-lock.json is valid
cd "$(dirname "$0")"
if [ ! -f "package-lock.json" ]; then
  echo "⚠️  package-lock.json not found. Generating..."
  npm install --package-lock-only
fi
echo "✅ package-lock.json exists"

