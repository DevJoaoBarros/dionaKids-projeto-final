import { useEffect, useState } from 'react';
import api from '../api';


// Página inicial depois do login: resuma geral da escola
function Dashboard() {
    const [dados, setDados] = useState(null);   //resposta do GET /dashboard
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard')
            .then((res) => setDados(res.data))
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível carregar o dashboard'));
    }, []);

    if (erro) {
        return <p className="bg-red-900/40 text-red-300 p-3 rounded">{erro}</p>;
    }

    // Enquanto o pedido não responde, dados ainda é null
    if (!dados) {
        return <p className="text-slate-400">A carregar...</p>;
    }

    const { totais, porCurso } = dados;

    // Os 4 cartões do topo
    const cartoes = [
        { titulo: 'Cursos', valor: totais.cursos },
        { titulo: 'Turmas', valor: totais.turmas },
        { titulo: 'Alunos', valor: totais.alunos },
        { titulo: 'Matrículas', valor: totais.matriculas },
    ];

    // Maior número de alunos num curso, para calcular a largura das barras
    const maxAlunos = Math.max(1, ...porCurso.map((c) => c.alunos));

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>

            {/* 2 colunas no telemóvel, 4 em ecrãs maiores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {cartoes.map((cartao) => (
                    <div key={cartao.titulo} className="bg-slate-800 p-4 rounded-lg">
                        <p className="text-slate-400 text-sm">{cartao.titulo}</p>
                        <p className="text-3xl font-bold text-white">{cartao.valor}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold text-white mb-3">Alunos por curso</h2>

            <ul className="space-y-2">
                {porCurso.map((curso) => (
                    <li key={curso.id} className="bg-slate-800 p-4 rounded-lg text-white">
                        <div className="flex justify-between mb-2">
                            <strong>{curso.nome}</strong>
                            <span className="text-slate-400 text-sm">
                                {curso.turmas} {curso.turmas === 1 ? 'turma' : 'turmas'} · {curso.alunos} {curso.alunos === 1 ? 'aluno' : 'alunos'}
                            </span>
                        </div>
                        {/* Barra proporcional ao número de alunos */}
                        <div className="bg-slate-700 h-2 rounded">
                            <div
                                className="bg-blue-500 h-2 rounded"
                                style={{ width: `${(curso.alunos / maxAlunos) * 100}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Dashboard;