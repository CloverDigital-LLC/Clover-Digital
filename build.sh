#!/bin/bash
# Build and prepare for GitHub Pages deployment
# Usage: ./build.sh

set -e

# Temporarily swap in source entry for vite
sed -i.bak 's|<script type="module" crossorigin src="/assets/[^"]*"></script>|<script type="module" src="/src/main.jsx"></script>|' index.html
sed -i.bak '/<link rel="stylesheet" crossorigin href="\/assets\/index-/d' index.html

# Build
rm -rf dist
npx vite build

# Get new asset filenames
JS_FILE=$(ls dist/assets/index-*.js | head -1 | xargs basename)
CSS_FILE=$(ls dist/assets/index-*.css | head -1 | xargs basename)

# Copy built assets
rm -f assets/index-*.js assets/index-*.css
cp dist/assets/$JS_FILE assets/
cp dist/assets/$CSS_FILE assets/

# Swap back to built asset references
sed -i.bak "s|<script type=\"module\" src=\"/src/main.jsx\"></script>|<script type=\"module\" crossorigin src=\"/assets/$JS_FILE\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/$CSS_FILE\">|" index.html

# Cleanup
rm -f index.html.bak

echo "Build complete: assets/$JS_FILE + assets/$CSS_FILE"
