import { useEffect, useState } from 'react';
import api from '../api';

// Cores pastel dos cartões e etoquetas, usadas por ordem.
// As classes estão escritas por inteiro para o Tailwind as encontrar no código.
const cores = [
    { fundo: 'bg-pessego', texto: 'text-pessgo-texto' },
    { fundo: 'bg-menta', texto: 'text-menta-texto' },
    { fundo: 'bg-lavanda', texto: 'text-lavanda-texto' },
    { fundo: 'bg-rosa', texto: 'text-rosa-texto'},
];



// Página inicial depois do login: resumo geral da escola
function Dashboard() {
    const [dados, setDados] = useState(null);   //resposta do GET /dashboard
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/dashboard')
            .then((res) => setDados(res.data))
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível carregar o dashboard'));
    }, []);

    if (erro) {
        return <p className="mensagem-erro">{erro}</p>;
    }

    // Enquanto o pedido não responde, dados ainda é null
    if (!dados) {
        return <p className="text-tinta-suave">A carregar...</p>;
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
        <div className="flex flex-col gap-7">
            <div>
                <h1 className="titulo-pagina">Olá! Assim está a escola hoje</h1>
                <p className="text-tinta-suave mt-1">Resumo dos cursos, turmas e alunos</p>
            </div>

            {/* 2 colunas no telemóvel, 4 em ecrãs maiores; cada cartão com a sua cor */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cartoes.map((cartao, i) => (
                    <div key={cartao.titulo} className={`${cores[i].fundo} rounded-3xl p-5`}>
                        <p className={`${cores[i].texto} font-bold`}>{cartao.titulo}</p>
                        <p className="font-titulo text-5xl font-extrabold">{cartao.valor}</p>
                    </div>
                ))}
            </div>

            <section className="cartao">
                <h2 className="font-titulo text-2xl font-bold mb-4">Alunos por curso</h2>

                <ul className="flex flex-col gap-4">
                    {porCurso.map((curso, i) => {
                        // % usa o resto da divisão: depois da 4.ª cor, volta à primeira
                        const cor = cores[i % cores.length];
                        return (
                            <li key={curso.id}>
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                    <strong className={`${cor.fundo} &{cor.texto} px-3 py-1 rounded-full`}>
                                        {curso.nome}
                                    </strong>       
                                    <span className="text-tinta-suave text-sm">
                                        {curso.turmas} {curso.turmas === 1 ? 'turma' : 'turmas'} · {curso.alunos} {curso.alunos === 1 ? 'aluno' : 'alunos'}
                                    </span>                         
                                </div>
                                {/* Barra proporcional ao número de alunos */}
                                <div className="bg-areia-clara h-3 rounded-full">
                                    <div
                                        className="bg-verde h-3 rounded-full"
                                        style={{ width: `${(curso.alunos / maxAlunos) * 100}%` }}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}

export default Dashboard;