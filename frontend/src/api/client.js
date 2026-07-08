import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.response.use(
  res => res.data,
  err => {
    let friendlyMessage = 'Ocurrió un problema temporal. Por favor, intenta de nuevo en unos instantes.';

    if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
      friendlyMessage = 'No logramos conectar con el servidor. Verifica tu conexión a internet o reintenta más tarde.';
    } else if (err.response) {
      if (err.response.status === 404) friendlyMessage = 'No encontramos el juego o la lista que buscabas.';
      if (err.response.status === 500) friendlyMessage = 'Tenemos un problema técnico en nuestro sistema. Ya lo estamos revisando.';
    }

    console.error('API error:', err.response?.data || err.message)
    return Promise.reject({ message: friendlyMessage, status: err.response?.status });
  }
)

export default client