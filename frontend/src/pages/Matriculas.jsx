import { useEffect, useState } from 'react';
import api from '../api';

function Matriculas() {
    const [matriculas, setMatriculas] = useState([]);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/matriculas')
            .then((res) => setMatriculas(res.data))
            .catch(() => setErro('Não foi possível carregar as matrículas'));
    }, []);

    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Matrículas</h1>
            <ul className="space-y-2">
                {matriculas.map((matricula) => {
                    return (
                        <li key={matricula.id} className="bg-slate-800 p-4 rounded-ls text-white">
                            <strong>{matricula.aluno.nome}</strong> matriculado(a) em {''}
                            <strong>{matricula.turma.curso.nome}</strong> ({matricula.turma.horario})
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default Matriculas;