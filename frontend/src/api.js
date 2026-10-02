import axios from 'axios';

// Cliente HTTP usado por todas as páginas para falar com o backend
const api = axios.create({
    baseURL: 'http://localhost:3000',
});

// Antes de cada pedido, junta o token salvo no login ao cabeçalho Authorization.
// Assim as páginas não precisam de se preocupar com autenticação.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
