
import api from '../axios';

export async function confirmSession(sessionId) {
  const { data } = await api.post(`/sessions/${sessionId}/confirm`);
  return data;
}

export async function declineSession(sessionId) {
  const { data } = await api.post(`/sessions/${sessionId}/decline`);
  return data;
}
