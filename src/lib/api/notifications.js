import api from '../axios';

export async function fetchNotifications({ status = 'all', page = 1, limit = 20 } = {}) {
  const { data } = await api.get('/friends/notifications', { params: { status, page, limit } });
  return data;
}

export async function markNotificationRead(id) {
  try {
    const { data } = await api.post(`/friends/notifications/${id}/read`);
    return data;
  } catch {
    const { data } = await api.put(`/friends/notifications/${id}/read`);
    return data;
  }
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/friends/notifications/read-all');
  return data;
}
