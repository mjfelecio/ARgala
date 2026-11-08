package com.viro.core.internal;

import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import com.viro.core.Renderer;
import java.time.Duration;
import java.util.Arrays;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowSystemClock;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE, sdk = 36)
@LooperMode(LooperMode.Mode.PAUSED)
public class ViroTouchGestureListenerTest {
    private Renderer renderer;
    private ViroTouchGestureListener listener;
    private View view;
    private long downTime;

    @Before public void setup() {
        renderer = new Renderer();
        view = new View(RuntimeEnvironment.getApplication());
        listener = new ViroTouchGestureListener(view.getContext(), renderer);
    }

    private void send(int action, long elapsed, float x, float y) {
        if (action == MotionEvent.ACTION_DOWN) downTime = SystemClock.uptimeMillis();
        long next = downTime + elapsed;
        long delta = Math.max(0, next - SystemClock.uptimeMillis());
        // The original packaged class uses wall time rather than event time.
        // Pace the trace too, so this suite also reproduces the upstream defect.
        try { Thread.sleep(delta); } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); throw new AssertionError(e);
        }
        ShadowSystemClock.advanceBy(Duration.ofMillis(delta));
        MotionEvent event;
        if (action == MotionEvent.ACTION_POINTER_DOWN || action == MotionEvent.ACTION_POINTER_UP) {
            MotionEvent.PointerProperties first = new MotionEvent.PointerProperties();
            first.id = 0; first.toolType = MotionEvent.TOOL_TYPE_FINGER;
            MotionEvent.PointerProperties second = new MotionEvent.PointerProperties();
            second.id = 1; second.toolType = MotionEvent.TOOL_TYPE_FINGER;
            MotionEvent.PointerCoords a = new MotionEvent.PointerCoords(); a.x = x; a.y = y; a.pressure = 1;
            MotionEvent.PointerCoords b = new MotionEvent.PointerCoords(); b.x = x + 40; b.y = y; b.pressure = 1;
            event = MotionEvent.obtain(downTime, next, action | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT), 2,
                    new MotionEvent.PointerProperties[]{first, second}, new MotionEvent.PointerCoords[]{a, b},
                    0, 0, 1, 1, 0, 0, android.view.InputDevice.SOURCE_TOUCHSCREEN, 0);
        } else {
            event = MotionEvent.obtain(downTime, next, action, x, y, 0);
        }
        listener.onTouch(view, event);
        event.recycle();
    }

    private void tap(long duration) {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_UP, duration, 100, 100);
    }

    @Test public void stationaryReleasesHaveNoTimingGapAndNeverActivateOnDown() {
        for (long duration : new long[]{10, 49, 50, 51, 100, 200, 500, 700}) {
            renderer.touches.clear();
            send(MotionEvent.ACTION_DOWN, 0, 100, 100);
            assertTrue("down at " + duration, renderer.touches.isEmpty());
            send(MotionEvent.ACTION_UP, duration, 100, 100);
            assertEquals("release at " + duration, Arrays.asList(0, 1), renderer.touches);
            ShadowSystemClock.advanceBy(Duration.ofMillis(400));
        }
    }

    @Test public void rapidConsecutiveTapsEachCompleteWithoutDoubleTapDelay() {
        tap(100);
        ShadowSystemClock.advanceBy(Duration.ofMillis(30));
        tap(100);
        ShadowSystemClock.advanceBy(Duration.ofMillis(30));
        tap(100);
        assertEquals(Arrays.asList(0, 1, 0, 1, 0, 1), renderer.touches);
    }

    @Test public void smallEarlyJitterStillCompletesOnce() {
        int slop = ViewConfiguration.get(view.getContext()).getScaledTouchSlop();
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_MOVE, 20, 100 + slop / 4, 100);
        send(MotionEvent.ACTION_UP, 150, 100 + slop / 4, 100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }

    @Test public void lateMoveUsesLegacyPathWithoutDuplicateFallback() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_MOVE, 100, 101, 100);
        assertEquals(Arrays.asList(0), renderer.touches);
        send(MotionEvent.ACTION_UP, 200, 101, 100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }

    @Test public void fastSwipeCannotBecomeATap() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_MOVE, 10, 300, 100);
        send(MotionEvent.ACTION_UP, 20, 300, 100);
        assertTrue(renderer.touches.isEmpty());
    }

    @Test public void cancelCannotCompleteAndNextGestureStartsFresh() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_CANCEL, 20, 100, 100);
        send(MotionEvent.ACTION_UP, 30, 100, 100);
        assertTrue(renderer.touches.isEmpty());
        tap(100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }

    @Test public void cancelAfterLegacyBeginNeverSendsACompletingUp() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_MOVE, 100, 101, 100);
        send(MotionEvent.ACTION_CANCEL, 120, 101, 100);
        send(MotionEvent.ACTION_UP, 130, 101, 100);
        assertEquals(Arrays.asList(0), renderer.touches);
        tap(100);
        assertEquals(Arrays.asList(0, 0, 1), renderer.touches);
    }

    @Test public void pointerChangeInvalidatesFallbackUntilTheNextDown() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        send(MotionEvent.ACTION_POINTER_DOWN, 10, 100, 100);
        send(MotionEvent.ACTION_POINTER_UP, 20, 100, 100);
        send(MotionEvent.ACTION_UP, 30, 100, 100);
        assertTrue(renderer.touches.isEmpty());
        tap(100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }

    @Test public void scaleAndRotationCannotFallBackToTap() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        listener.onScaleBegin(new android.view.ScaleGestureDetector(view.getContext(), listener));
        send(MotionEvent.ACTION_UP, 20, 100, 100);
        assertTrue(renderer.touches.isEmpty());
        setup();
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        listener.onRotateBegin(new RotationGestureDetector(listener));
        send(MotionEvent.ACTION_UP, 20, 100, 100);
        assertTrue(renderer.touches.isEmpty());
    }

    @Test public void destroyRetiresPendingGesture() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        listener.destroy();
        send(MotionEvent.ACTION_UP, 100, 100, 100);
        assertTrue(renderer.touches.isEmpty());
    }

    @Test public void duplicateReleaseCannotRepeatClick() {
        tap(10);
        send(MotionEvent.ACTION_UP, 20, 100, 100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }

    @Test public void interceptedGestureCannotCompleteLaterAndNextTapRecovers() {
        send(MotionEvent.ACTION_DOWN, 0, 100, 100);
        listener.setOnTouchListener((v, e) -> e.getActionMasked() == MotionEvent.ACTION_MOVE);
        send(MotionEvent.ACTION_MOVE, 20, 100, 100);
        send(MotionEvent.ACTION_UP, 100, 100, 100);
        assertTrue(renderer.touches.isEmpty());
        listener.setOnTouchListener(null);
        tap(100);
        assertEquals(Arrays.asList(0, 1), renderer.touches);
    }
}
