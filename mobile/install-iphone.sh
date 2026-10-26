#!/bin/bash
# Builds the app and installs it on Ariel's iPhone with his free Apple ID — no
# paid developer account, no TestFlight. A free signature lasts 7 days; run this
# again (iPhone on the same Wi-Fi as the Mac, or plugged in) to renew. The data on
# the phone (cards, grades not yet sent, audio) survives a reinstall.
#
#   mobile/install-iphone.sh
#
# The App Store bundle id (com.arielbenavi.yallacards) is taken for a personal
# team, so this build uses its own: il.ariel.yalla.personal.
set -euo pipefail
cd "$(dirname "$0")/.."

TEAM_ID=${TEAM_ID:-Y93Y9ZACWZ}            # personal team of the Apple ID signed into Xcode
BUNDLE_ID=il.ariel.yalla.personal
OUT=mobile/build/personal

DEVICE=$(xcrun devicectl list devices 2>/dev/null | grep -i iphone | grep -E ' (available|connected)' | grep -v unavailable | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
[[ -n "$DEVICE" ]] || { echo "✗ no iPhone available — same Wi-Fi as the Mac, unlocked, or plug it in"; exit 1; }
UDID=$(xcrun xctrace list devices 2>/dev/null | awk -F'[()]' '/iPhone/ && !/Simulator/ {print $(NF-1); exit}')

node mobile/build.mjs
npx cap sync ios >/dev/null

xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination "id=$UDID" -derivedDataPath "$OUT" -packageAuthorizationProvider netrc \
  -allowProvisioningUpdates DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" CURRENT_PROJECT_VERSION="$(date +%Y%m%d%H%M)" build > "$OUT.log" 2>&1 \
  || { grep -E "error:" "$OUT.log" | head -5; echo "✗ build failed — full log: $OUT.log"; exit 1; }

xcrun devicectl device install app --device "$DEVICE" "$OUT/Build/Products/Release-iphoneos/App.app" >/dev/null
echo "✅ installed on the iPhone — valid until $(date -v+7d '+%d/%m %H:%M')"
