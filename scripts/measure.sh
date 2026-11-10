#!/bin/bash
set -u
LABEL=${1:?usage: measure.sh <label> [serial]}
SERIAL=${2:-emulator-5580}
PKG=dev.example.expoimageapi25repro
OUT=${OUT_DIR:-/tmp/expo-image-api25-out}/$LABEL
mkdir -p "$OUT"
export ANDROID_SERIAL=$SERIAL

adb logcat -c
adb shell am force-stop $PKG
adb shell am start -n $PKG/.MainActivity >/dev/null
sleep 20

(
  while true; do
    ts=$(date +%H:%M:%S)
    pid=$(adb shell pidof $PKG | tr -d '\r')
    if [ -z "$pid" ]; then echo "$ts,DEAD" >> "$OUT/heap.csv"; else
      row=$(adb shell dumpsys meminfo $PKG | grep -m1 "Dalvik Heap" | awk '{print $7","$8","$9}')
      echo "$ts,$row" >> "$OUT/heap.csv"
    fi
    sleep 4
  done
) &
SAMPLER=$!

maestro test --test-output-dir "$OUT/maestro" "$(dirname "$0")/../maestro/tabs-scroll.yaml" > "$OUT/maestro.log" 2>&1
echo "maestro exit: $?" >> "$OUT/maestro.log"
kill $SAMPLER 2>/dev/null

sleep 2
adb logcat -d > "$OUT/logcat.txt"
grep -E "FATAL EXCEPTION|OutOfMemoryError|CHECK\(mByteArrayObj|Fatal signal|has died|Process .* \(pid .*\) has died" "$OUT/logcat.txt" | head -20 > "$OUT/crash-lines.txt"
echo "== $LABEL: crash lines"; cat "$OUT/crash-lines.txt"
echo "== $LABEL: peak Heap Alloc (KB); csv = time,HeapSize,HeapAlloc,HeapFree"; awk -F, '$2 ~ /^[0-9]+$/ {if ($3>m) m=$3} END {print m}' "$OUT/heap.csv"
echo "== $LABEL: dead samples"; grep -c DEAD "$OUT/heap.csv"
