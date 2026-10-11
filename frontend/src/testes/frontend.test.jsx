// Testes do frontend (Vitest + React Testing Library).
// O ficheiro api.js é substituído por uma versão falsa (mock):
// os testes não precisam do backend a correr.

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import Cursos from '../pages/Cursos';
import RotaPrivada from '../components/RotaPrivada';
import api from '../api';

// Quando um componente importar '../api', recebe esta versão falsa
vi.mock('../api', () => ({
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Login', () => {
    test('mostra os campos de email e palavra-passe e o botão Entrar', () => {
        render(<Login />, { wrapper: MemoryRouter });

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Palavra-passe')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    });

    test('mostra a mensagem do backend quando o login falha', async () => {
        api.post.mockRejectedValue({ response: { data: { erro: 'Email ou palavra-passe inválidos' } } });
        render(<Login />, { wrapper: MemoryRouter });

        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'admin@dionakids.com' } });
        fireEvent.change(screen.getByPlaceholderText('Palavra-passe'), { target: { value: 'errada' } });
        fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

        // findBy espera que o texto apareça (o pedido é assíncrono)
        expect(await screen.findByText('Email ou palavra-passe inválidos')).toBeInTheDocument();
        expect(api.post).toHaveBeenCalledWith('/login', { email: 'admin@dionakids.com', senha: 'errada' });
    });
});

describe('Cursos', () => {
    test('mostra os cursos devolvidos pela API', async () => {
        api.get.mockResolvedValue({
            data: [
                { id: 1, nome: 'DionaKidz', faixaEtaria: '7-10', preco: 220 },
                { id: 2, nome: 'DionaTeenz', faixaEtaria: '11-14', preco: 250 },
            ],
        });

        render(<Cursos />);

        expect(await screen.findByText('DionaKidz')).toBeInTheDocument();
        expect(screen.getByText('DionaTeenz')).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/cursos');
    });

    test('mostra uma mensagem quando ainda não há cursos', async () => {
        api.get.mockResolvedValue({ data: [] });

        render(<Cursos />);

        expect(await screen.findByText('Ainda não há cursos. Adicione o primeiro acima.')).toBeInTheDocument();
        // Os campos têm label: dá para os encontrar pelo texto que aparece por cima
        expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    });
});

describe('RotaPrivada', () => {
    // Desenha a app com duas rotas: o login ("/") e uma página protegida
    function renderizarEm(caminho) {
        render(
            <MemoryRouter initialEntries={[caminho]}>
                <Routes>
                    <Route path="/" element={<p>Página de login</p>} />
                    <Route
                        path="/cursos"
                        element={<RotaPrivada><p>Página protegida</p></RotaPrivada>}
                    />
                </Routes>
            </MemoryRouter>
        );
    }

    test('sem token, redireciona para o login', () => {
        renderizarEm('/cursos');

        expect(screen.getByText('Página de login')).toBeInTheDocument();
        expect(screen.queryByText('Página protegida')).not.toBeInTheDocument();
    });

    test('com token, mostra a página protegida', () => {
        localStorage.setItem('token', 'um-token-qualquer');
        renderizarEm('/cursos');

        expect(screen.getByText('Página protegida')).toBeInTheDocument();
    });
});
