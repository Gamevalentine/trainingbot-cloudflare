#!/usr/bin/env bash
set -euo pipefail

WORK_DIR=".timeline_build"
OVERLAY_DIR="timeline-overlay"
UPSTREAM="https://github.com/MartinDelophy/ai-video-editor.git"

rm -rf "$WORK_DIR" public functions
git clone --depth=1 "$UPSTREAM" "$WORK_DIR"

# Reconstruct the user's customized source files from small text chunks.
mkdir -p "$WORK_DIR/src/components" "$WORK_DIR/src/lib" "$WORK_DIR/scripts"
cat "$OVERLAY_DIR"/App.jsx.part* > "$WORK_DIR/src/App.jsx"
cat "$OVERLAY_DIR"/WorkflowWorkspace.jsx.part* > "$WORK_DIR/src/components/WorkflowWorkspace.jsx"
cp "$OVERLAY_DIR/Topbar.jsx" "$WORK_DIR/src/components/Topbar.jsx"
cp "$OVERLAY_DIR/workflowCache.js" "$WORK_DIR/src/lib/workflowCache.js"
cp "$OVERLAY_DIR/workflowDownload.js" "$WORK_DIR/src/lib/workflowDownload.js"
cp "$OVERLAY_DIR/workflowLogoTracking.js" "$WORK_DIR/src/lib/workflowLogoTracking.js"
cp "$OVERLAY_DIR/workflowOcr.js" "$WORK_DIR/src/lib/workflowOcr.js"
cp "$OVERLAY_DIR/workflowPerformance.js" "$WORK_DIR/src/lib/workflowPerformance.js"
cp "$OVERLAY_DIR/workflowProxyPreview.js" "$WORK_DIR/src/lib/workflowProxyPreview.js"
cp "$OVERLAY_DIR/viteMediaDownloader.mjs" "$WORK_DIR/scripts/viteMediaDownloader.mjs"
cp "$OVERLAY_DIR/vite.config.mjs" "$WORK_DIR/vite.config.mjs"
cat "$OVERLAY_DIR/workflow.css" >> "$WORK_DIR/src/styles.css"

cd "$WORK_DIR"
npm install --no-save --legacy-peer-deps @xyflow/react@12.11.6 tesseract.js@7.0.0
npm run build
cd ..

rm -rf public
cp -a "$WORK_DIR/dist" public
cat > public/_headers <<'EOF'
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: same-origin
EOF
cat > public/_redirects <<'EOF'
/* /index.html 200
EOF
rm -rf "$WORK_DIR"
echo "Timeline Studio Cloudflare Pages build ready"
