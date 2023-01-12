import { SCHEDULER_USERNAME, SCHEDULER_KEY, SCHEDULER_API_URL } from './constants';
import axios from 'axios';
axios.defaults.headers.common['Content-Type'] = 'application/json';

export async function getToken() {
  const body = { Username: SCHEDULER_USERNAME, Password: SCHEDULER_KEY };

  return await axios.post(`${SCHEDULER_API_URL}/token`, body).then(({ data }) => {
    return data.token;
  });
}
