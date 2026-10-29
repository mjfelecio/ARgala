const { withAndroidManifest } = require('expo/config-plugins');

/** SDK57 AssetLegacyFactory needs WRITE only through API29; modern saves need no library read grant. */
module.exports = function withSaveOnlyMedia(config) {
  return withAndroidManifest(config, config => {
    const permissions = config.modResults.manifest['uses-permission'] ?? [];
    const write = permissions.find(entry => entry.$['android:name'] === 'android.permission.WRITE_EXTERNAL_STORAGE');
    if (write) write.$['android:maxSdkVersion'] = '29';
    return config;
  });
};
