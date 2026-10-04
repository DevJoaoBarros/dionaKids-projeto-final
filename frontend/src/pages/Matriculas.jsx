import { useEffect, useState } from 'react';
import api from '../api';

// Página de Matrículas: matricula um aluno numa turma e permite cancelar.
// Não há edição: para trocar de turma, cancela-se e cria-se outra matrícula.
function Matriculas() {
    const [matriculas, setMatriculas] = useState([]);
    const [alunos, setAlunos] = useState([]);   // opções do seletor de aluno
    const [turmas, setTurmas] = useState([]);   // opções do seletor de turma
    const [erro, setErro] = useState(null);
    // Valores escolhidos no formulário
    const [alunoId, setAlunoId] = useState('');
    const [turmaId, setTurmaId] = useState('');

    function carregarMatriculas() {
        api.get('/matriculas')
            .then((res) => setMatriculas(res.data))
            .catch(() => setErro('Não foi possível carregar as matrículas'));
    }
    
    function carregarAlunos() {
        api.get('/alunos')
            .then((res) => setAlunos(res.data))
            .catch(() => setErro('Não foi possível carregar os alunos'));
    }

    function carregarTurmas() {
        api.get('/turmas')
            .then((res) => setTurmas(res.data))
            .catch(() => setErro('Não foi possível carregar as turmas'));
    }

    // Ao abrir a página, carrega as matrículas e as opções dos dois seletores
    useEffect(() => {
       carregarMatriculas();
       carregarAlunos();
       carregarTurmas();
    }, []);

    // Cria a matrícula; o backend devolve 409 se o aluno já estiver nessa turma
    function handleSubmit(e) {
        e.preventDefault(); // impede o navegador de recarregar a página
        setErro(null);
        api.post('/matriculas', {alunoId: Number(alunoId), turmaId: Number(turmaId) })
            .then(() => {
                setAlunoId('');
                setTurmaId('');
                carregarMatriculas();
            })
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível matricular o aluno'));
    }
    // Cancela (apaga) uma matrícula
    function handleDelete(id) {
        setErro(null);
        api.delete(`/matriculas/${id}`)
            .then(() => carregarMatriculas())
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível cancelar a matrícula'));
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Matrículas</h1>

            {erro && (
                <p className="bg-red-900/40 text-red-300 p-3 rounded mb-4">{erro}</p>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg flex gap-2 mb-6">
                <select
                    value={alunoId}
                    onChange={(e) => setAlunoId(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                >
                    <option value="">Selecione um aluno</option>
                    {alunos.map((aluno) => (
                        <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                    ))}
                </select>
                <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                >
                    <option value="">Selecione uma turma</option>
                    {turmas.map((turma) => (
                        <option key={turma.id} value={turma.id}>{turma.curso.nome} - {turma.horario}</option>                    
                ))}
                </select>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded font-bold">
                    Matricular
                </button>
            </form>

            <ul className="space-y-2">
                {matriculas.map((matricula) => (
                    <li key={matricula.id} className="bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center">
                        <span>
                            <strong>{matricula.aluno.nome}</strong> matriculado(a) em{' '}
                            <strong>{matricula.turma.curso.nome}</strong> ({matricula.turma.horario})
                        </span>
                        <button
                            onClick={() => handleDelete(matricula.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Cancelar matrícula
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Matriculas;