import { useEffect, useState } from 'react';
import api from '../api';

function Cursos() {
    const [cursos, setCursos] = useState([]);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/cursos')
        .then((res) => setCursos(res.data))
        .catch(() => setErro('Não foi possível carregar os cursos'));
    }, []);

    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Cursos</h1>
            <ul className="space-y-2">
                {cursos.map((curso) => (
                    <li key={curso.id} className="bg-slate-800 p-4 rounded-lg text-white">
                        <strong>{curso.nome}</strong> - {curso.faixaEtaria} anos - R$ {curso.preco}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Cursos;