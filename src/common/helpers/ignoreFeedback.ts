export function ignoreListenerFeedback(key, value) {
  if (key == '') return true;
  let ignore = true;
  if (!!value && validListenerFeedback(key, value)) ignore = false;
  return ignore;
}

const validListenerFeedback = (key, value = true) => {
  if (key === 'doorFb' || key === 'occFb' || key === 'userActivityFb') return true;
  return false;
};

const validListenerFeedbackBank = {
  occFb: true,
  doorFb: true,
  userActivityFb: true,
};

export function isValidTriggerFeedback(key, value) {
  let ignore = false;
  if (key === 'doorFb') return true;
  return ignore;
}

const validTriggerFeedback = {
  doorFb: false,
};
