#!/bin/bash

# ============================================================
# upload_to_remote.sh
# Usage: ./upload_to_remote.sh
# ============================================================

# We need lftp installed before using this

FTP_USER="crm@adcrew.us"
FTP_PASS="4RVFATKG23L93YCO2O"
FTP_HOST="ftp://adcrew.us"
REMOTE_DIR="/public_html/health-crm"
LOCAL_DIR="$(pwd)"
#!/bin/bash

# =====================
# Config - update this manually each release
APP_VERSION="1.2.10"
# =====================

echo "Minifying..."

./minify.sh

BUILD=$(date +"%Y%m%d%H%M%S")
VERSION="v$APP_VERSION.$BUILD"

echo "🚀 Deploying: $VERSION"

run_sed() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -E -i '' "$@"
  else
    sed -E -i "$@"
  fi
}

# Recursively find all HTML files in dist
find dist -type f -name "*.html" | while read -r file; do

  echo "  📄 Processing: $file"

  # Restore {version} placeholder first (from previous deploy)
  run_sed "s|v[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|{version}|g" "$file"

  # Now replace with new version
  run_sed "s|{version}|$VERSION|g" "$file"

  # Update existing ?v=xxx → new version
  run_sed "s|(\.css)\?v=[^\"'&]*|\1?v=$VERSION|g" "$file"
  run_sed "s|(\.js)\?v=[^\"'&]*|\1?v=$VERSION|g"  "$file"

  # Add ?v=xxx to links that don't have a version yet
  run_sed "s|(\.css)([\"'])|\1?v=$VERSION\2|g" "$file"
  run_sed "s|(\.js)([\"'])|\1?v=$VERSION\2|g"  "$file"

done

echo ""
echo "✅ Done! Version: $VERSION"

# -------------------------------
# Step 1: Delete remote files
# -------------------------------
echo "Deleting remote files..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:passive-mode on
set ssl:verify-certificate no
cd $REMOTE_DIR
glob -a rm -r *
bye
EOF

# -------------------------------
# Step 2: Upload from dist to remote
# -------------------------------
echo "Uploading files..."

lftp -u "$FTP_USER","$FTP_PASS" "$FTP_HOST" <<EOF
set ftp:passive-mode on
set ssl:verify-certificate no

mirror -R \
  --delete \
  --parallel=5 \
  --verbose \
  --exclude-glob "*.sh" \
  ./dist $REMOTE_DIR

bye
EOF