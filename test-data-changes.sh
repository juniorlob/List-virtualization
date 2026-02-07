#!/bin/bash
# Test script to run data change tests

# Kill any existing vitest processes
pkill -9 -f vitest 2>/dev/null || true
sleep 1

# Run the specific test file
NODE_ENV=test npx vitest run tests/unit/components/virtualized-list.test.tsx --reporter=verbose --no-coverage 2>&1
