
# 1. Define the path to your .env file
ENV_FILE=".env.production"

# 2. Check if the file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: Environment file $ENV_FILE not found!"
    exit 1
fi

# 3. Load, strip comments, and remove hidden \r (Carriage Returns)
export $(grep -v '^#' "$ENV_FILE" | sed 's/\r$//' | xargs)

# 4. Optional: Verify variables are loaded
if [ -z "$FTP_PASS" ]; then
    echo "❌ Error: FTP_PASS is empty. Please check your .env file."
    exit 1
fi

echo "✅ Environment loaded successfully for user: $FTP_USER"

# We need lftp installed before using this

LOCAL_DIR="$(pwd)"
#!/bin/bash

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

  # Remove test scripts
  run_sed "s|<script\s+src=\"\./test/[^>]+\.js\">\s*</script>||g" "$file"

done

find dist -type f -name "*.js" | while read -r file; do

  echo "  📄 Processing: $file"

  # Now replace with new version
  run_sed "s|CONFIG_URL:\s*\"\s*\"|CONFIG_URL: \"$GOOGLE_SCRIPT_URL\"|g" "$file"
  run_sed "s|CONFIG_SHEET_ID:\s*\"\s*\"|CONFIG_SHEET_ID: \"$GOOGLE_SCRIPT_SS_ID\"|g" "$file"
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
glob -a mrm -r -x "maintenance.html" *
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