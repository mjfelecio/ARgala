package com.argala.araudio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ArSystemAudioModule : Module() {
  private val main = Handler(Looper.getMainLooper())
  private val attributes = AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()
  private var backgrounded = false
  private var destroyed = false
  private var current: Playback? = null

  private class Playback(
    val token: Int,
    val player: MediaPlayer,
    val promise: Promise,
    val timeout: Runnable,
    var abandonFocus: (() -> Unit)? = null,
  )

  private fun runOnMain(action: () -> Unit) {
    if (Looper.myLooper() == main.looper) action() else main.post(action)
  }

  private fun finish(token: Int) {
    val playback = current?.takeIf { it.token == token } ?: return
    current = null
    main.removeCallbacks(playback.timeout)
    runCatching { playback.player.release() }
    runCatching { playback.abandonFocus?.invoke() }
    playback.promise.resolve(null)
  }

  @Suppress("DEPRECATION")
  private fun requestFocus(manager: AudioManager, token: Int): (() -> Unit)? {
    // Each cue has its own listener, so late focus loss cannot stop a replacement.
    val listener = AudioManager.OnAudioFocusChangeListener { change ->
      if (change < 0) runOnMain { finish(token) }
    }
    val mode = AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val request = AudioFocusRequest.Builder(mode)
        .setAudioAttributes(attributes)
        .setWillPauseWhenDucked(true)
        .setOnAudioFocusChangeListener(listener, main)
        .build()
      if (manager.requestAudioFocus(request) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return null
      return { manager.abandonAudioFocusRequest(request) }
    }
    if (manager.requestAudioFocus(listener, AudioManager.STREAM_MUSIC, mode) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return null
    return { manager.abandonAudioFocus(listener) }
  }

  private fun canPlay() = !destroyed && !backgrounded && appContext.currentActivity?.hasWindowFocus() == true

  private fun resource(clip: String) = when (clip) {
    "reveal" -> R.raw.reveal
    "panel_open" -> R.raw.panel_open
    "page_turn" -> R.raw.page_turn
    "panel_close" -> R.raw.panel_close
    "view_switch" -> R.raw.view_switch
    else -> null
  }

  private fun play(token: Int, clip: String, promise: Promise) {
    val resource = resource(clip)
    val context = appContext.reactContext
    val manager = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    if (!canPlay() || resource == null || context == null || manager == null) {
      promise.resolve(null)
      return
    }

    current?.let { finish(it.token) }
    val player = try {
      MediaPlayer()
    } catch (_: RuntimeException) {
      promise.resolve(null)
      return
    }
    val timeout = Runnable { finish(token) }
    val playback = Playback(token, player, promise, timeout)
    current = playback
    // Bound even a missing platform prepare or completion callback. All five
    // approved one-shots are under a second and none is worth playing late.
    main.postDelayed(timeout, 2000)
    try {
      player.setAudioAttributes(attributes)
      player.setVolume(0.35f, 0.35f)
      player.setOnCompletionListener { finish(token) }
      player.setOnErrorListener { _, _, _ ->
        finish(token)
        true
      }
      player.setOnPreparedListener {
        if (current !== playback) return@setOnPreparedListener
        try {
          playback.abandonFocus = if (canPlay()) requestFocus(manager, token) else null
          if (playback.abandonFocus == null) finish(token) else player.start()
        } catch (_: RuntimeException) {
          finish(token)
        }
      }
      val asset = context.resources.openRawResourceFd(resource)
      if (asset == null) {
        finish(token)
        return
      }
      asset.use { file ->
        player.setDataSource(file.fileDescriptor, file.startOffset, file.length)
      }
      player.prepareAsync()
    } catch (_: Exception) {
      finish(token)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ArSystemAudio")

    AsyncFunction("play") { token: Int, clip: String, promise: Promise ->
      play(token, clip, promise)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stop") { token: Int ->
      finish(token)
    }.runOnQueue(Queues.MAIN)

    OnActivityEntersForeground { runOnMain { backgrounded = false } }
    OnActivityEntersBackground {
      runOnMain {
        backgrounded = true
        current?.let { finish(it.token) }
      }
    }
    OnDestroy {
      runOnMain {
        destroyed = true
        current?.let { finish(it.token) }
      }
    }
  }
}
