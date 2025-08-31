
import api from '../axios';

export async function confirmSession(sessionId) {
  const { data } = await api.post(`/sessions/${sessionId}/confirm`);
  return data;
}
