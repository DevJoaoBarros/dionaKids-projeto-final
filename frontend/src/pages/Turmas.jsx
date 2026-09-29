import { useEffect, useState } from 'react';
import api from '../api';

function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [erro, setErro] = useState(null);
    const [horario, setHorario] = useState('');
    const [professor, setProfessor] = useState('');
    const [cursoId, setCursoId] = useState('');

    function carregarTurmas() {
        api.get('/turmas')
            .then((res) => setTurmas(res.data))
            .catch(() => setErro('Não foi possível carregar as turmas'));
    }

    function carregarCursos() {
        api.get('/cursos')
            .then((res) => setCursos(res.data))
            .catch(() => setErro('Não foi possível carregar os cursos'))
    }

    useEffect(() => {
        carregarTurmas();
        carregarCursos();
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        api.post('/turmas', { horario, professor, cursoId: Number(cursoId) })
            .then(() => {
                setHorario('');
                setProfessor('');
                setCursoId('');
                carregarTurmas();
            })
            .catch(() => setErro('Não foi possível criar a truma'));
    }

    function handleDelete(id) {
        api.delete(`/turmas/${id}`)
            .then(() => carregarTurmas())
            .catch(() => setErro('Não foi possível remover a turma'));
    }

    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Turmas</h1>

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
                    Adicionar
                </button>
            </form>

            <ul className='space-y-2'>
                {turmas.map((turma) => (
                    <li key={turma.id} className="bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center">
                        <span>
                            <strong>{turma.curso.nome}</strong> - {turma.horario} - Professor: {turma.professor}
                        </span>
                        <button
                            onClick={() => handleDelete(turma.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            Remover
                        </button>     
                    </li>                    
                ))}
            </ul>
        </div>
    );
}

export default Turmas;