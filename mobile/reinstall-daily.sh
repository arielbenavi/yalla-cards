#!/bin/bash
# Run by launchd every day (~/Library/LaunchAgents/il.ariel.yalla.reinstall.plist):
# renews the free 7-day signature long before it runs out. When the iPhone is not
# reachable that day it just fails and tries again tomorrow.
# Log: ~/Library/Logs/yalla-reinstall.log
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh" >/dev/null 2>&1
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:$PATH"
echo "── $(date '+%Y-%m-%d %H:%M')"
"$(dirname "$0")/install-iphone.sh"
