// src/lib/api/friends.js
import api from '../axios';

export async function respondFriendRequest(senderId, action /* "Accepted" | "Rejected" */) {
  const { data } = await api.post('/friends/respond', { senderId, action });
  return data; // { message, data: { friendId, status } }
}

export async function fetchPendingFriendRequests() {
  const { data } = await api.get('/friends/requests');
  return data;
}