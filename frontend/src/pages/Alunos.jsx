import { useEffect, useState } from 'react';
import api from '../api';

function Alunos() {
    const [alunos, setAlunos] = useState([]);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        api.get('/alunos')
            .then((res) => setAlunos(res.data))
            .catch (() => setErro('Não foi possível carregar os alunos'));
    }, []);
    
    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Alunos</h1>
            <ul className="space-y-2">
                {alunos.map((aluno) => (
                    <li key={aluno.id} className="bg-slate-800 p-4 rounded-lg text-white">
                        <strong>{aluno.nome}</strong> - {aluno.idade} anos - Responsável: {aluno.contatoResponsavel}
                    </li>
                ))}
            </ul> 
        </div>
    );
}

export default Alunos;