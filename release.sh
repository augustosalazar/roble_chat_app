#!/usr/bin/env bash
set -euo pipefail

REPOS=(
  app-roble
  auth-service-roble
  db-service-roble
  front-roble
)

ROOT="$(cd "$(dirname "$0")" && pwd)"

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  read -p "Version (e.g. v1.2.3): " VERSION
fi

if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "ERROR: Version must match vX.Y.Z (e.g. v1.2.3)"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI not found. Install it from https://cli.github.com/"
  exit 1
fi

echo "=== Releasing $VERSION across ${#REPOS[@]} repos ==="

for dir in "${REPOS[@]}"; do
  echo ""
  echo "--- $dir ---"
  cd "$ROOT/$dir"

  if ! git diff-index --quiet HEAD --; then
    echo "  ✗ Dirty working tree. Commit and push changes first."
    exit 1
  fi

  if git rev-parse "$VERSION" &>/dev/null; then
    echo "  Tag $VERSION already exists"
  else
    git tag -a "$VERSION" -m "Release $VERSION"
    git push origin "$VERSION"
    echo "  ✓ Tag $VERSION pushed"
  fi

  gh release create "$VERSION" \
    --title "Release $VERSION" \
    --generate-notes \
    --latest \
    --repo "openlabun/$dir"
  echo "  ✓ Release created: https://github.com/openlabun/$dir/releases/tag/$VERSION"
done

echo ""
echo "=== All done ==="
