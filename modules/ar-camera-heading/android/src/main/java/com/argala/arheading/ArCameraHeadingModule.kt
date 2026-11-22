package com.argala.arheading

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.atan2
import kotlin.math.hypot

class ArCameraHeadingModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private var manager: SensorManager? = null
  private var owner: Int? = null
  private var declination: Float? = null
  private var lastEventNanos = 0L
  private val worldFromDevice = FloatArray(9)
  private val listener = object : SensorEventListener {
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    override fun onSensorChanged(event: SensorEvent) {
      val activeOwner = owner ?: return
      if (event.timestamp - lastEventNanos < 100_000_000L) return
      lastEventNanos = event.timestamp
      val measuredAt = System.currentTimeMillis() - (SystemClock.elapsedRealtimeNanos() - event.timestamp) / 1_000_000L
      val northCorrection = declination
      if (northCorrection == null || event.accuracy < SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) {
        sendEvent("onHeading", mapOf("owner" to activeOwner, "degrees" to null, "measuredAt" to measuredAt))
        return
      }
      SensorManager.getRotationMatrixFromVector(worldFromDevice, event.values)
      // Device +Z points out of the screen. The rear camera looks along -Z.
      val east = -worldFromDevice[2].toDouble()
      val north = -worldFromDevice[5].toDouble()
      val heading = if (hypot(east, north) < 0.2) null
        else (Math.toDegrees(atan2(east, north)) + northCorrection + 360.0) % 360.0
      sendEvent("onHeading", mapOf("owner" to activeOwner, "degrees" to heading, "measuredAt" to measuredAt))
    }
  }

  private fun stop() {
    manager?.unregisterListener(listener)
    manager = null
    owner = null
    declination = null
    lastEventNanos = 0L
  }

  override fun definition() = ModuleDefinition {
    Name("ArCameraHeading")
    Events("onHeading")

    Function("setLocation") { requestedOwner: Int, latitude: Double, longitude: Double, timestamp: Double ->
      main.post {
        if (owner == requestedOwner && latitude.isFinite() && latitude in -90.0..90.0 && longitude.isFinite() && longitude in -180.0..180.0 && timestamp.isFinite()) {
          declination = GeomagneticField(latitude.toFloat(), longitude.toFloat(), 0f, timestamp.toLong()).declination
        }
      }
      Unit
    }

    Function("start") { requestedOwner: Int ->
      val context = appContext.reactContext
      main.post {
        if (owner != requestedOwner) {
          stop()
          val service = context?.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
          val sensor = service?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
          if (service != null && sensor != null && service.registerListener(listener, sensor, 100_000, main)) {
            manager = service
            owner = requestedOwner
          }
        }
      }
      Unit
    }

    Function("stop") { requestedOwner: Int ->
      main.post { if (owner == requestedOwner) stop() }
      Unit
    }
    OnActivityEntersBackground { main.post { stop() } }
    OnDestroy { main.post { stop() } }
  }
}
