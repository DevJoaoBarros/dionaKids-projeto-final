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
            <h1 className="titulo-pagina mb-5">Matrículas</h1>

            {/* role="alert": o leitor de ecrã lê a mensagem assim que ela aparece */}
            {erro && (
                <p role="alert" className="mensagem-erro mb-4">{erro}</p>
            )}

            {/* items-end: o botão alinha-se com os campos, por baixo dos textos das labels */}
            <form onSubmit={handleSubmit} className="cartao flex flex-wrap items-end gap-3 mb-6">
                <label className="rotulo flex-1 min-w-48">
                    Aluno
                    <select
                        value={alunoId}
                        onChange={(e) => setAlunoId(e.target.value)}
                        className="campo"
                        required
                    >
                        <option value="">Selecione um aluno</option>
                        {alunos.map((aluno) => (
                            <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                        ))}
                    </select>
                </label>
                <label className="rotulo flex-1 min-w-48">
                    Turma
                    <select
                        value={turmaId}
                        onChange={(e) => setTurmaId(e.target.value)}
                        className="campo"
                        required
                    >
                        <option value="">Selecione uma turma</option>
                        {turmas.map((turma) => (
                            <option key={turma.id} value={turma.id}>{turma.curso.nome} - {turma.horario}</option>
                        ))}
                    </select>
                </label>
                <button type="submit" className="botao">
                    Matricular
                </button>
            </form>

            {/* Sem matrículas: mostra uma mensagem em vez de uma lista vazia */}
            {matriculas.length === 0 && (
                <p className="lista-vazia">Ainda não há matrículas. Matricule um aluno acima.</p>
            )}

            <ul className="flex flex-col gap-3">
                {matriculas.map((matricula) => (
                    <li key={matricula.id} className="cartao py-4 flex flex-wrap justify-between items-center gap-3">
                        <span>
                            <strong>{matricula.aluno.nome}</strong> matriculado(a) em{' '}
                            <strong>{matricula.turma.curso.nome}</strong> ({matricula.turma.horario})
                        </span>
                        {/* aria-label: o leitor de ecrã diz de quem é a matrícula que vai cancelar */}
                        <button
                            onClick={() => handleDelete(matricula.id)}
                            aria-label={`Cancelar matrícula de ${matricula.aluno.nome} em ${matricula.turma.curso.nome}`}
                            className="acao bg-rosa text-rosa-texto hover:bg-rosa-texto hover:text-white"
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
