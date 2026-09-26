import { useEffect, useState } from 'react';
import api from '../api';

function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/turmas')
            .then((res) => setTurmas(res.data))
            .catch(() => setErro('Não foi possível carregar as turmas'));
    }, []);

    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Turmas</h1>
            <ul className='space-y-2'>
                {turmas.map((turma) => (
                    <li key={turma.id} className="bg-slate-800 p-4 rounded-lg text-white">
                        <strong>{turma.curso.nome}</strong> - {turma.horario} - Professor: {turma.professor}
                    </li>                    
                ))}
            </ul>
        </div>
    );
}

export default Turmas;