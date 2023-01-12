export function getDeviceKey(msg = {}) {
  let deviceKey = '';

  Object.keys(msg).forEach(key => {
    if (triggerKeys[key]) deviceKey = key;
  });

  return deviceKey;
}

const triggerKeys = {
  doorFb: true,
  occFb: true,
  userActivityFb: true,
};
