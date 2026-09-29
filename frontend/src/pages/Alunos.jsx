import { useEffect, useState } from 'react';
import api from '../api';

function Alunos() {
    const [alunos, setAlunos] = useState([]);
    const [erro, setErro] = useState(null);
    const [nome, setNome] = useState('');
    const [idade, setIdade] = useState('');
    const [contatoResponsavel, setContatoResponsavel] = useState('');

    function carregaAlunos() {
        api.get('/alunos')
            .then((res) => setAlunos(res.data))
            .catch(() => setErro('Não foi possível carregar os alunos'));
    }

    useEffect(() => {
        carregaAlunos();
    }, []);

    function handleSubmit(e) {
        e.preventDefault();
        api.post('/alunos', { nome, idade: Number(idade), contatoResponsavel })
            .then(() => {
                setNome('');
                setIdade('');
                setContatoResponsavel('');
                carregaAlunos();
            })
            .catch(() => setErro('Não foi possível criar o aluno'));
    }

    function handleDelete(id) {
        api.delete(`/alunos/${id}`)
            .then(() => carregaAlunos())
            .catch(() => setErro('Não foi possível remover o aluno'));
    }

    if (erro) {
        return <p className="text-red-400">{erro}</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Alunos</h1>

            <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                />
                <input
                    type="number"
                    placeholder="Idade"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded w-24"
                    min="0"
                    required
                />
                <input
                    type="text"
                    placeholder="Contato do responsável"
                    value={contatoResponsavel}
                    onChange={(e) => setContatoResponsavel(e.target.value)}
                    className="bg-slate-700 text-white p-2 rounded flex-1"
                    required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded font-bold">
                    Adicionar
                </button>
            </form>

            <ul className="space-y-2">
                {alunos.map((aluno) => (
                    <li key={aluno.id} className="bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center">
                        <span>
                            <strong>{aluno.nome}</strong> - {aluno.idade} anos - Responsável: {aluno.contatoResponsavel}
                        </span>
                        <button
                            onClick={() => handleDelete(aluno.id)}
                            className="text-red-400 hover:text-red-300 tet-sm"
                        >
                            Remover
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Alunos;