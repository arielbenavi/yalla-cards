#!/bin/bash
# Builds the iPhone app and uploads it to App Store Connect → TestFlight.
# See docs/ios-app.md for the one-time setup on Re'ut's developer account.
#
#   TEAM_ID=XXXXXXXXXX mobile/release.sh
#
# Signing, either way:
#   - Xcode → Settings → Accounts has an Apple ID that is on Re'ut's team, or
#   - an App Store Connect API key (no Xcode login needed):
#       ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=mobile/AuthKey_….p8 TEAM_ID=… mobile/release.sh
set -euo pipefail
cd "$(dirname "$0")/.."

: "${TEAM_ID:?set TEAM_ID — the 10-character Team ID from developer.apple.com → Account → Membership details}"

AUTH=()
if [[ -n "${ASC_KEY_ID:-}" ]]; then
  : "${ASC_ISSUER_ID:?ASC_ISSUER_ID is needed with ASC_KEY_ID}"
  : "${ASC_KEY_PATH:?ASC_KEY_PATH is needed with ASC_KEY_ID}"
  AUTH=(-authenticationKeyPath "$(cd "$(dirname "$ASC_KEY_PATH")" && pwd)/$(basename "$ASC_KEY_PATH")"
        -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
fi

OUT=mobile/build
BUILD_NUMBER=$(date +%Y%m%d%H%M)   # every upload needs a higher build number
rm -rf "$OUT" && mkdir -p "$OUT"

echo "▸ web layer (production server)"
node mobile/build.mjs
npx cap sync ios

echo "▸ archive (build $BUILD_NUMBER)"
# -packageAuthorizationProvider netrc: with the default (keychain) the Swift
# package download waits forever on a keychain prompt nobody sees
xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$OUT/Yalla.xcarchive" \
  DEVELOPMENT_TEAM="$TEAM_ID" CODE_SIGN_STYLE=Automatic CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  -allowProvisioningUpdates ${AUTH[@]+"${AUTH[@]}"} -packageAuthorizationProvider netrc archive | tail -5

echo "▸ upload to App Store Connect"
sed "s/__TEAM_ID__/$TEAM_ID/" mobile/ExportOptions.plist > "$OUT/ExportOptions.plist"
xcodebuild -exportArchive -archivePath "$OUT/Yalla.xcarchive" -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT/export" -allowProvisioningUpdates ${AUTH[@]+"${AUTH[@]}"} | tail -5

echo "✅ uploaded build $BUILD_NUMBER — in TestFlight after Apple's processing (usually 5–15 minutes)"
