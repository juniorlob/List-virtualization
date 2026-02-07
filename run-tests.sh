#!/bin/bash
# Run vitest in non-interactive mode
NODE_ENV=test npx vitest run --reporter=verbose --no-watch
