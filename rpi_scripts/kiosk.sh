#!/bin/bash

echo "HINTS..."
echo "To stop kiosk run: killall chromium"
echo "To restart kiosk run: ./kiosk.sh"

# let things get ready; doesn't want to work without this ???
sleep 10

# debug...
#set -x

# x setup
export DISPLAY=:0
xhost +localhost

# keeps RPi from turning off the display
xset s noblank
xset s off
#xset -dpms

# hides the mouse...
unclutter -idle 0.5 -root &

# remove error flags from Chromium configuration
#sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' /home/$USER/.config/chromium/Default/Preferences
#sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' /home/$USER/.config/chromium/Default/Preferences

# launch browser...
/usr/bin/chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:8000&

# hints...


