import axios from 'axios';

export const setCookie = (name, value, days = 7) => { //sets a cookie in  browser with name valye and expire date
  const expires = new Date(); // created date in acutal date
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000); // adds days in date
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`; //sets cookie in browser
};

export const deleteCookie = (name) => { //deletes cookies from browser , while marking it as expired in the past
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const getCookie = (name) => {// reads cookie value from browser while searching it with name
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`)); //document.cookie returns all cookies like a single string
  return match ? decodeURIComponent(match[1]) : ''; //match searches a pattern in string
};

const api = axios.create({ //creates axios instance with default configuration that is used for all http requests
baseURL: `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => { // before every request, adds headers automatically
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  const method = (config.method || 'get').toUpperCase(); // adds csrf token in header only for requests that change data (POST PUT PATCH DELETE)
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (unsafeMethods.includes(method)) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

// Auto-refresh interceptor: on 401, tries to refresh access token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url ?? '';

        // Skip refresh for auth endpoints (login, register, refresh, etc.)
        const isAuthEndpoint =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register') ||
            requestUrl.includes('/auth/refresh') ||
            requestUrl.includes('/auth/verify') ||
            requestUrl.includes('/auth/forgot') ||
            requestUrl.includes('/auth/reset') ||
            requestUrl.includes('/auth/logout');

        // If 401, not from auth endpoint, and not already retried
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint
        ) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            // Without a refresh token, let the caller handle the unauthenticated request.
            if (!refreshToken) {
                isRefreshing = false;
                localStorage.removeItem('auth_token');
                return Promise.reject(error);
            }

            try {
                const response = await api.post('/auth/refresh', {
                    refresh_token: refreshToken,
                });

                const newToken =
                    response.data?.data?.access_token ||
                    response.data?.access_token;

                if (!newToken) throw new Error('No access token returned');

                // Save new access token
                localStorage.setItem('auth_token', newToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                // Resolve all queued requests
                processQueue(null, newToken);

                // Retry original request
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed → logout
                processQueue(refreshError, null);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
