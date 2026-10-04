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

// Se o backend responder 401 (token expirado ou inválido), apaga o token e volta ao login.
// O pedido de /login fica de fora: aí o 401 só quer dizer "senha errada".
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && err.config.url !== '/login') {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(err);
    }
);

export default api;
