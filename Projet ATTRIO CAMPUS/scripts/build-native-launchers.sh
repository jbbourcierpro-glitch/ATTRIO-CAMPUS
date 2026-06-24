#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE_IMAGE="$PROJECT_DIR/src/assets/brand/attrio-logo-a.jpg"
LAUNCHERS_DIR="$PROJECT_DIR/launchers"
ICONSET_DIR="$LAUNCHERS_DIR/iconset/attrio.iconset"
BASE_PNG="$LAUNCHERS_DIR/iconset/attrio-base.png"
ICNS_PATH="$LAUNCHERS_DIR/ATTRIO CAMPUS.icns"
ICO_PATH="$LAUNCHERS_DIR/ATTRIO CAMPUS.ico"
APP_PATH="$WORKSPACE_DIR/ATTRIO CAMPUS.app"
APPLESCRIPT_PATH="$LAUNCHERS_DIR/iconset/launcher.js"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Source image not found: $SOURCE_IMAGE"
  exit 1
fi

mkdir -p "$LAUNCHERS_DIR/iconset"
rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

sips -s format png "$SOURCE_IMAGE" --out "$BASE_PNG" >/dev/null

for size in 16 32 128 256 512; do
  doubled=$((size * 2))
  sips -z "$size" "$size" "$BASE_PNG" --out "$ICONSET_DIR/icon_${size}x${size}.png" >/dev/null
  sips -z "$doubled" "$doubled" "$BASE_PNG" --out "$ICONSET_DIR/icon_${size}x${size}@2x.png" >/dev/null
done

python3 "$PROJECT_DIR/scripts/make_icns.py" "$ICONSET_DIR" "$ICNS_PATH"
python3 "$PROJECT_DIR/scripts/make_ico.py" "$ICONSET_DIR/icon_128x128@2x.png" "$ICO_PATH"

COMMAND_PATH_SHELL="$(python3 -c 'import shlex,sys; print(shlex.quote(sys.argv[1]))' "$WORKSPACE_DIR/Lancer ATTRIO CAMPUS.command")"

cat > "$APPLESCRIPT_PATH" <<APPLESCRIPT
ObjC.import('stdlib')

const app = Application.currentApplication()
app.includeStandardAdditions = true
app.doShellScript("open $COMMAND_PATH_SHELL")
APPLESCRIPT

rm -rf "$APP_PATH"
osacompile -l JavaScript -o "$APP_PATH" "$APPLESCRIPT_PATH" >/dev/null
cp "$ICNS_PATH" "$APP_PATH/Contents/Resources/applet.icns"
rm -f "$APP_PATH/Contents/Resources/Assets.car"
/usr/libexec/PlistBuddy -c "Delete :CFBundleIconName" "$APP_PATH/Contents/Info.plist" >/dev/null 2>&1 || true
/usr/libexec/PlistBuddy -c "Set :CFBundleIconFile applet.icns" "$APP_PATH/Contents/Info.plist" >/dev/null 2>&1 || true
touch "$APP_PATH"

echo "Mac app generated: $APP_PATH"
echo "Mac icon generated: $ICNS_PATH"
echo "Windows icon generated: $ICO_PATH"
