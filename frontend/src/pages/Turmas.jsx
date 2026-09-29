import { useEffect, useState } from 'react';
import api from '../api';

function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [erro, setErro] = useState(null);
    const [horario, setHorario] = useState('');
    const [professor, setProfessor] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [editandoId, setEditandoId] = useState(null); // null = modo criar

    function carregarTurmas() {
        api.get('/turmas')
            .then((res) => setTurmas(res.data))
            .catch(() => setErro('Não foi possível carregar as turmas'));
    }

    function carregarCursos() {
        api.get('/cursos')
            .then((res) => setCursos(res.data))
            .catch(() => setErro('Não foi possível carregar os cursos'));
    }

    useEffect(() => {
        carregarTurmas();
        carregarCursos();
    }, []);

    function limparFormulario() {
        setHorario('');
        setProfessor('');
        setCursoId('');
        setEditandoId(null);
    }

    function iniciarEdicao(turma) {
        setHorario(turma.horario);
        setProfessor(turma.professor);
        setCursoId(String(turma.cursoId)); // o select guarda texto
        setEditandoId(turma.id);
    }

    function handleSubmit(e) {
        e.preventDefault();
        setErro(null);
        const dados = { horario, professor, cursoId: Number(cursoId) };

        const pedido = editandoId
            ? api.put(`/turmas/${editandoId}`, dados)
            : api.post('/turmas', dados);

        pedido
            .then(() => {
                limparFormulario();
                carregarTurmas();
            })
            .catch((err) => setErro(err.response?.data?.erro || (editandoId
                ? 'Não foi possível atualizar a turma'
                : 'Não foi possível criar a turma')));
    }

    function handleDelete(id) {
        setErro(null);
        api.delete(`/turmas/${id}`)
            .then(() => {
                if (id === editandoId) limparFormulario(); // se apagou a que estava a editar
                carregarTurmas();
            })
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível remover a turma'));
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Turmas</h1>

            {erro && (
                <p className="bg-red-900/40 text-red-300 p-3 rounded mb-4">{erro}</p>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg flex gap-2 mb-6">
                <select
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                >
                    <option value="">Selecione um curso</option>
                    {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>{curso.nome}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Horário"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                />
                <input
                    type="text"
                    placeholder="Professor"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded font-bold">
                    {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
                {editandoId && (
                    <button
                        type="button"
                        onClick={limparFormulario}
                        className="bg-slate-600 hover:bg-slate-500 text-white px-4 rounded"
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <ul className="space-y-2">
                {turmas.map((turma) => (
                    <li
                        key={turma.id}
                        className={`bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center ${
                            turma.id === editandoId ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                        <span>
                            <strong>{turma.curso.nome}</strong> - {turma.horario} - Professor: {turma.professor}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => iniciarEdicao(turma)}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(turma.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                            >
                                Remover
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Turmas;