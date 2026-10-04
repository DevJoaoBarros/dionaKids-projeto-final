import { useEffect, useState } from 'react';
import api from '../api';

// Página de Alunos: lista, cria, edita e remove alunos.
// O mesmo formulário serve para criar e para editar (depende de editandoId).
function Alunos() {
    const [alunos, setAlunos] = useState([]);   // lista vinda da API
    const [erro, setErro] = useState(null);     // mensagem de erro mostrada no topo
    // Campos do formulário
    const [nome, setNome] = useState('');
    const [idade, setIdade] = useState('');
    const [contatoResponsavel, setContatoResponsavel] = useState('');
    const [editandoId, setEditandoId] = useState(null); // null = modo criar

    // Busca os alunos no backend e atualiza a lista
    function carregaAlunos() {
        api.get('/alunos')
            .then((res) => setAlunos(res.data))
            .catch(() => setErro('Não foi possível carregar os alunos'));
    }

    // [] = corre só uma vez, quando a página abre
    useEffect(() => {
        carregaAlunos();
    }, []);

    // Esvazia os campos e volta ao modo "criar"
    function limparFormulario() {
        setNome('');
        setIdade('');
        setContatoResponsavel('');
        setEditandoId(null);
    }

    // Preenche o formulário com os dados do aluno clicado e entra no modo "editar"
    function iniciarEdicao(aluno) {
        setNome(aluno.nome);
        setIdade(String(aluno.idade)); // o input guarda texto
        setContatoResponsavel(aluno.contatoResponsavel);
        setEditandoId(aluno.id);
    }

    // Envio do formulário: cria (POST) ou atualiza (PUT), conforme o modo
    function handleSubmit(e) {
        e.preventDefault(); // impede o navegador de recarregar a página
        setErro(null);
        const dados = { nome, idade: Number(idade), contatoResponsavel };

        // Com editandoId atualiza o aluno existente; sem ele cria um novo
        const pedido = editandoId
            ? api.put(`/alunos/${editandoId}`, dados)
            : api.post('/alunos', dados);

        pedido
            .then(() => {
                limparFormulario();
                carregaAlunos();
            })
            // Mostra a mensagem do backend; se não houver, usa uma genérica
            .catch((err) => setErro(err.response?.data?.erro || (editandoId
                ? 'Não foi possível atualizar o aluno'
                : 'Não foi possível criar o aluno')));
    }

    // Remove um aluno. O backend recusa (409) se o aluno ainda tiver matrículas.
    function handleDelete(id) {
        setErro(null);
        api.delete(`/alunos/${id}`)
            .then(() => {
                if (id === editandoId) limparFormulario(); // se apagou o que estava a editar
                carregaAlunos();
            })
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível remover o aluno'));
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-4">Alunos</h1>

            {erro && (
                <p className="bg-red-900/40 text-red-300 p-3 rounded mb-4">{erro}</p>
            )}

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
                    max="120"
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

            {/* Lista de alunos; o que está a ser editado ganha um contorno azul */}
            <ul className="space-y-2">
                {alunos.map((aluno) => (
                    <li
                        key={aluno.id}
                        className={`bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center ${
                            aluno.id === editandoId ? 'ring-2 ring-blue-500' : ''
                        }`}
                    >
                        <span>
                            <strong>{aluno.nome}</strong> - {aluno.idade} anos - Responsável: {aluno.contatoResponsavel}
                        </span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => iniciarEdicao(aluno)}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(aluno.id)}
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

export default Alunos;