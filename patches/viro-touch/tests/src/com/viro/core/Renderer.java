package com.viro.core;

import java.util.ArrayList;
import java.util.List;

/** JNI boundary only; gesture recognition and Android MotionEvents remain real. */
public final class Renderer {
    public final List<Integer> touches = new ArrayList<>();
    public void onTouchEvent(int action, float x, float y) { touches.add(action); }
    public void onPinchEvent(int action, float scale, float x, float y) { }
    public void onRotateEvent(int action, float radians, float x, float y) { }
}
