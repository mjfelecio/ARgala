const { withAndroidManifest } = require('expo/config-plugins');

/** Viro 3.0.3 replaces the feature array; normalize after its plugin runs.
 * Ordinary Maps/discovery must remain installable without AR hardware.
 */
module.exports = function withOptionalAr(config) {
  return withAndroidManifest(config, config => {
    const manifest = config.modResults.manifest;
    const features = manifest['uses-feature'] ??= [];
    for (const name of ['android.hardware.camera', 'android.hardware.camera.ar']) {
      let feature = features.find(entry => entry.$['android:name'] === name);
      if (!feature) { feature = { $: { 'android:name': name } }; features.push(feature); }
      feature.$['android:required'] = 'false';
      feature.$['tools:replace'] = 'required';
    }
    return config;
  });
};
