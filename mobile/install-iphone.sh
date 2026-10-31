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

# Xcode reuses a cached free profile until it expires, so reinstalling does not
# by itself renew anything: on 2026-10-31 the app stopped ("no longer
# available") with a profile from 23/10 while this script reported a date a
# week ahead. Drop the cached profile when it has under 3 days left, so the
# build below makes a fresh 7-day one.
for dir in "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles" "$HOME/Library/MobileDevice/Provisioning Profiles"; do
  [[ -d "$dir" ]] || continue
  for f in "$dir"/*.mobileprovision; do
    [[ -f "$f" ]] || continue
    plist=$(security cms -D -i "$f" 2>/dev/null) || continue
    [[ $(echo "$plist" | plutil -extract Entitlements.application-identifier raw -o - - 2>/dev/null) == *"$BUNDLE_ID" ]] || continue
    exp=$(echo "$plist" | plutil -extract ExpirationDate raw -o - - 2>/dev/null)
    left=$(( $(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$exp" +%s) - $(date +%s) ))
    if (( left < 3 * 86400 )); then echo "renewing the signing profile (expires $exp)"; rm "$f"; fi
  done
done

node mobile/build.mjs
npx cap sync ios >/dev/null

xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination "id=$UDID" -derivedDataPath "$OUT" -packageAuthorizationProvider netrc \
  -allowProvisioningUpdates DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" CURRENT_PROJECT_VERSION="$(date +%Y%m%d%H%M)" build > "$OUT.log" 2>&1 \
  || { grep -E "error:" "$OUT.log" | head -5
       grep -q "No Accounts" "$OUT.log" && echo "✗ Xcode is signed out of the Apple ID — Xcode → Settings → Accounts → + → Apple ID, then run this again"
       echo "✗ build failed — full log: $OUT.log"; exit 1; }

xcrun devicectl device install app --device "$DEVICE" "$OUT/Build/Products/Release-iphoneos/App.app" >/dev/null
# The real expiry, from the profile inside the app (not install date + 7 days)
exp=$(security cms -D -i "$OUT/Build/Products/Release-iphoneos/App.app/embedded.mobileprovision" | plutil -extract ExpirationDate raw -o - -)
echo "✅ installed on the iPhone — valid until $(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$exp" +%s | xargs -I{} date -r {} '+%d/%m %H:%M')"
