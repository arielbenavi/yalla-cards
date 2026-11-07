#!/bin/bash
# Run by launchd three times a day, 08:30, 13:30 and 20:30
# (~/Library/LaunchAgents/il.ariel.yalla.reinstall.plist): renews the free 7-day
# signature long before it runs out. When the iPhone is not reachable it fails
# and tries again at the next run; with under 2 days left the Mac shows a
# notification, so the app never stops without warning.
# Log: ~/Library/Logs/yalla-reinstall.log
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1
nvm use 20 >/dev/null 2>&1 || true
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"
echo "── $(date '+%Y-%m-%d %H:%M')"
if "$(dirname "$0")/install-iphone.sh"; then exit 0; fi

# Failed: warn when the signature on the phone is close to running out
app=mobile/build/personal/Build/Products/Release-iphoneos/App.app/embedded.mobileprovision
cd "$(dirname "$0")/.."
exp=$(security cms -D -i "$app" 2>/dev/null | plutil -extract ExpirationDate raw -o - - 2>/dev/null)
left=$(( ${exp:+$(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$exp" +%s)} - $(date +%s) ))
if [[ -z "$exp" ]] || (( left < 2 * 86400 )); then
  osascript -e 'display notification "חבר את האייפון למק או לאותו Wi-Fi ופתח אותו — החידוש נכשל" with title "יאללה כרטיסים פג בקרוב"'
fi
exit 1
