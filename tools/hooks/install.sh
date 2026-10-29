#!/bin/sh
# Turns on this repo's git hooks for this clone (no CLI needed): git reads hooks from tools/hooks instead of .git/hooks.
# Undo with: git config --unset core.hooksPath
set -e
cd "$(git rev-parse --show-toplevel)"
chmod +x tools/hooks/pre-commit tools/hooks/commit-msg
git config core.hooksPath tools/hooks
echo "git hooks enabled: core.hooksPath = $(git config core.hooksPath)"
