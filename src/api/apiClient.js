import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');

export const STORAGE_KEYS = {
  USER_TOKEN: '@geodex_user_token',
  USER_DATA: '@geodex_user_data',
  GUEST_TOKEN: '@geodex_guest_token',
  GUEST_INFO: '@geodex_guest_info'
};

export async function apiRequest(endpoint, { method = 'GET', body, isMultipart = false, customHeaders = {} } = {}) {
  const userToken = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
  const guestToken = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);

  const headers = { ...customHeaders };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  } else if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }

  const config = {
    method,
    headers,
    cache: 'no-store' // Evita que el navegador devuelva 304 vacío en /user/me
  };

  if (body !== undefined) {
    config.body = isMultipart ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (networkError) {
    const err = new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido y la dirección IP sea correcta.');
    err.status = 0;
    throw err;
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorMessage =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.details) ? data.details.join(', ') : null) ||
      `Error ${response.status} en la solicitud`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }

  return data;
}

export const getBaseApiUrl = () => BASE_URL;