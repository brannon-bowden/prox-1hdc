export function validMsg(msg = {}) {
  let valid = true;

  requiredKeys.forEach(key => {
    if (msg[key] === undefined) {
      console.log('Invalid key: ' + key);
      console.log(JSON.stringify(msg));
      valid = false;
    }
  });

  return valid;
}

const requiredKeys = ['dId', 'aId'];
