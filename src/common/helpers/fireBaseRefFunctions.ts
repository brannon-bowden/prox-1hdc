export function getDomainIdFromFireRef(fireRef?: string) {
  let fireRefArray = fireRef.split('/');
  fireRefArray.splice(0, 2);
  return fireRefArray[0];
}

export function getIdFromFireRef(fireRef?: string) {
  let fireRefArray = fireRef.split('/');

  return fireRefArray[fireRefArray.length - 1];
}
