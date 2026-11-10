# expo-image-android7-oom

Minimal reproduction: `expo-image` 58.0.18 on Android 7.1 (API 25) with the 48 MB Java heap of low-end devices runs out of memory while navigating between tabs that contain several image lists. A patch that fixes it is in [`fix/`](fix/expo-image+58.0.18.patch).

Stack: Expo SDK 58 (`expo` 58.0.23), `expo-image` 58.0.18, `expo-router` 58.0.30, React Native 0.88.1, `react-native-screens` 4.30.1.

## What the app does

Three tabs (Shelf, Feed, Gallery), all mounted by the tab navigator and detached from the window when inactive:

- Shelf: 14 vertical rows, each a horizontal `FlatList` of 16 images (source 450x255, shown at 225x128 dp).
- Feed: a vertical `FlatList` of 80 images (source 768x432, shown at 344x193 dp).
- Gallery: 10 rows, each a horizontal `FlatList` of 14 images (source 768x432, shown at 300x169 dp).

Every `FlatList` uses `removeClippedSubviews`. Images come from `picsum.photos` with a fixed seed and size per cell, so the device needs internet access.

## Steps

1. Create the emulator. System image `system-images;android-25;google_apis;arm64-v8a` (use `x86_64` on an Intel host), then set these values in `~/.android/avd/<name>.avd/config.ini`:

   ```
   vm.heapSize=48
   hw.ramSize=2048
   hw.lcd.width=1080
   hw.lcd.height=1920
   hw.lcd.density=420
   ```

   Start it with `emulator -avd <name> -no-audio`. `adb shell getprop dalvik.vm.heapgrowthlimit` must print `48m`.

2. Build and install the release binary:

   ```
   npm install
   npx expo prebuild -p android
   cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
   adb install -r app/build/outputs/apk/release/app-release.apk
   ```

   `expo-image` is listed in `expo.autolinking.android.buildFromSource` so that the precompiled `.aar` is not used and the patch below applies to the build.

3. Run the flow. It opens the app and, five times, visits the three tabs scrolling vertically and horizontally in each:

   ```
   maestro test --test-output-dir /tmp/maestro-out maestro/tabs-scroll.yaml
   ```

   `scripts/measure.sh <label> [adb-serial]` runs the same flow while sampling `dumpsys meminfo` (`Dalvik Heap`) every 4 s and collecting `logcat` into `$OUT_DIR/<label>/`.

4. Apply the fix and repeat from step 2:

   ```
   git checkout with-patch
   npm install
   ```

   `with-patch` only adds `patches/expo-image+58.0.18.patch`, which `patch-package` applies on `postinstall`. The same file is in `fix/` on `main`.

## Expected

The flow finishes five rounds with the app still running.

## Actual (without the patch)

The process dies during the first round or at the start of the second one. `logcat` shows `java.lang.OutOfMemoryError` thrown in `GlideExecutor` (`glide-source-thread-0`) followed by `OutOfMemoryError thrown while trying to throw OutOfMemoryError`, and `Process ... has died`. See [`results/oom-unpatched-excerpt.txt`](results/oom-unpatched-excerpt.txt).

## Results

Emulator API 25, 1080x1920 at 420 dpi, heap limit 48 MB, release build, three runs per variant. `Heap Alloc` is the `Dalvik Heap` column of `adb shell dumpsys meminfo`, sampled every 4 s (raw samples in [`results/`](results/)).

| Variant | Run | Flow result | Peak Heap Alloc |
| --- | --- | --- | --- |
| `expo-image` 58.0.18 | 1 | process died (OOM) | 47.8 MB |
| `expo-image` 58.0.18 | 2 | process died (OOM) | 48.8 MB |
| `expo-image` 58.0.18 | 3 | process died (OOM) | 48.4 MB |
| with `fix/expo-image+58.0.18.patch` | 1 | 5 rounds completed | 20.3 MB |
| with `fix/expo-image+58.0.18.patch` | 2 | 5 rounds completed | 22.0 MB |
| with `fix/expo-image+58.0.18.patch` | 3 | 5 rounds completed | 22.5 MB |

## Cause

On API 25 and lower, bitmap pixels live in the 48 MB Java heap. Points 1 and 2 were read from `am dumpheap` dumps of a larger app (large `byte[]` instances owned by detached views); they were not re-measured separately on this minimal app. The three changes of the patch were measured together, not one by one.

1. `expo-image` keeps the bitmap of a view that is detached from the window, so the images of inactive tabs accumulate.
2. A view that never attached (a cell that `removeClippedSubviews` leaves out of the hierarchy) still starts its load and keeps the result.
3. Glide's default memory cache and bitmap pool are sized from the heap and add to the pressure.

## The patch

`fix/expo-image+58.0.18.patch` does three things, all only when `Build.VERSION.SDK_INT < 26`:

- On `onDetachedFromWindow`, it clears the Glide targets and recycles both image views; on `onAttachedToWindow` it loads again.
- `rerenderIfNeeded` does not start a load while the view is not attached.
- `ExpoImageAppGlideModule` limits the bitmap pool and the memory cache to half a screen each, and the array pool to 1 MB.
