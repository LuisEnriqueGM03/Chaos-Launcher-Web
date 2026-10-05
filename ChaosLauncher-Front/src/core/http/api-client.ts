import axios, { AxiosError, AxiosResponse } from 'axios';
import { getApiUrl } from '../config/env';

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  // El JWT viaja en una cookie httpOnly: el JavaScript de la página nunca lo ve
  withCredentials: true,
});

// Interceptor para desempaquetar respuestas de la API { success: true, data: ... }
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Si la respuesta viene envuelta en { success: true, data: ... }, desempaquetar data
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError) => {
    let errorMsg = 'Error en la conexión con el servidor de ChaosLauncher';

    if (error.response?.data) {
      const respData: any = error.response.data;
      if (typeof respData.message === 'string') {
        errorMsg = respData.message;
      } else if (Array.isArray(respData.message)) {
        errorMsg = respData.message.join(', ');
      }
    } else if (error.message) {
      errorMsg = error.message;
    }

    return Promise.reject(new Error(errorMsg));
  },
);
