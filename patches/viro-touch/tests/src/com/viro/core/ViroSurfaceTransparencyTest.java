package com.viro.core;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Region;
import android.view.View;
import android.widget.FrameLayout;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(manifest = Config.NONE, sdk = 36, instrumentedPackages = {"com.viro.core"},
        shadows = ViroSurfaceTransparencyTest.CameraStartup.class)
public class ViroSurfaceTransparencyTest {
    // The hardware/JNI startup is unavailable on the JVM. The packaged AR view,
    // Android ViewGroup traversal and Region operations remain real.
    @Implements(ViroViewARCore.class)
    public static class CameraStartup extends org.robolectric.shadows.ShadowViewGroup {
        @Implementation protected static void __staticInitializer__() { }
        @Implementation protected void init(Context context, ViroViewARCore.StartupListener listener) { }
    }

    private ViroViewARCore arView() {
        Activity activity = Robolectric.buildActivity(Activity.class).setup().get();
        ViroViewARCore ar = new ViroViewARCore(activity);
        ar.setBackgroundColor(Color.BLACK);
        View surface = new View(activity) {
            @Override public boolean gatherTransparentRegion(Region region) {
                if (region != null) region.op(0, 0, 1080, 2400, Region.Op.UNION);
                return true;
            }
        };
        ar.addView(surface, new FrameLayout.LayoutParams(1080, 2400));
        ar.layout(0, 0, 1080, 2400);
        surface.layout(0, 0, 1080, 2400);
        return ar;
    }

    @Test public void surfaceCannotAdvertiseFutureOverlayPixelsAsTransparent() {
        ViroViewARCore ar = arView();
        Region windowHint = new Region(0, 0, 1080, 2400);
        assertFalse("AR window can show the camera beneath it", ar.gatherTransparentRegion(windowHint));
        assertTrue("later Help and footer painting must remain composited", windowHint.isEmpty());
    }

    @Test public void nullRegionRemainsSupported() {
        assertFalse(arView().gatherTransparentRegion(null));
    }
}
