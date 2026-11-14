#!/bin/bash
# Builds an unsigned .ipa of the app for SideStore / LiveContainer on Ariel's
# iPhone. SideStore signs it with his free Apple ID and renews the 7-day
# signature on the phone itself, so no Mac is needed after the first install.
# Content comes from Vercel, so rebuild only when native code or plugins change.
#
#   mobile/build-ipa.sh   → mobile/build/YallaCards.ipa
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=mobile/build/ipa
export PATH="$HOME/.nvm/versions/node/v24.22.2/bin:$PATH"  # Capacitor needs Node 22+

node mobile/build.mjs
npx cap sync ios >/dev/null
xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Release \
  -destination "generic/platform=iOS" -derivedDataPath "$OUT" -packageAuthorizationProvider netrc \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  PRODUCT_BUNDLE_IDENTIFIER=il.ariel.yalla.personal CURRENT_PROJECT_VERSION="$(date +%Y%m%d%H%M)" \
  build > "$OUT.log" 2>&1 || { grep -E "error:" "$OUT.log" | head -5; echo "✗ build failed — $OUT.log"; exit 1; }

rm -rf "$OUT/Payload" && mkdir -p "$OUT/Payload"
cp -R "$OUT/Build/Products/Release-iphoneos/App.app" "$OUT/Payload/"
(cd "$OUT" && rm -f ../YallaCards.ipa && zip -qry ../YallaCards.ipa Payload)
echo "✅ mobile/build/YallaCards.ipa ($(du -h mobile/build/YallaCards.ipa | cut -f1))"
