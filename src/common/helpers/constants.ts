export const BWS_HOST_NAME = process.env.BWS_HOST_NAME;
export const SERVICE_NAME = process.env.SERVICE_NAME;
export const BWS_HOST = process.env.BWS_HOST;
export const BASE_URL = process.env.BASE_URL || '/api/v3/occupancy';
export const SCHEDULER_API_URL = process.env.SCHEDULER_API_URL;
export const SCHEDULER_USERNAME = process.env.SCHEDULER_USERNAME;
export const SCHEDULER_KEY = process.env.SCHEDULER_KEY;
export const EXPRESS_PORT = process.env.EXPRESS_PORT;
export const RABBIT_URL = process.env.RABBIT_URL;
export const timerCompleteAction = {
  Type: 'https',
  Uri: BWS_HOST + BASE_URL + '/timerComplete',
  Method: 'POST',
};

export const LATITUDE = 26.122437;
export const LONGITUDE = -80.137314;
