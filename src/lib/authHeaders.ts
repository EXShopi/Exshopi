import { useAuthStore } from "../store/auth";

export function getAuthHeaders() {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default getAuthHeaders;
