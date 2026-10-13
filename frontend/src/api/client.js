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

api.interceptors.response.use( // after every response check if status is 401 (not logged in) , if yes delete token from localstorage 
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[api] 401 Unauthorized:', error.config?.url);
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;