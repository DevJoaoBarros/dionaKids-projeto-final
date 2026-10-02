import { Navigate } from 'react-router-dom';

// Protege páginas que exigem login: sem token salvo, redireciona para a tela de login.
// Obs.: só verifica se o token existe. Se estiver expirado, o backend responde 401.
function RotaPrivada({ children }) {
    const token = localStorage.getItem('token');

    if(!token) {
        // "replace" evita que o botão Voltar do navegador regresse à página protegida
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RotaPrivada;
