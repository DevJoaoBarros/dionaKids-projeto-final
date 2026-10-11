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
            <h1 className="titulo-pagina mb-5">Alunos</h1>

            {/* role="alert": o leitor de ecrã lê a mensagem assim que ela aparece */}
            {erro && (
                <p role="alert" className="mensagem-erro mb-4">{erro}</p>
            )}

            {/* items-end: os botões alinham-se com os campos, por baixo dos textos das labels */}
            <form onSubmit={handleSubmit} className="cartao flex flex-wrap items-end gap-3 mb-6">
                <label className="rotulo flex-1 min-w-48">
                    Nome
                    <input
                        type="text"
                        placeholder="Nome do aluno"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="campo"
                        required
                    />
                </label>
                <label className="rotulo w-24">
                    Idade
                    <input
                        type="number"
                        placeholder="Ex.: 9"
                        value={idade}
                        onChange={(e) => setIdade(e.target.value)}
                        className="campo"
                        min="0"
                        max="120"
                        required
                    />
                </label>
                <label className="rotulo flex-1 min-w-48">
                    Contato do responsável
                    <input
                        type="text"
                        placeholder="Ex.: 912 345 678"
                        value={contatoResponsavel}
                        onChange={(e) => setContatoResponsavel(e.target.value)}
                        className="campo"
                        required
                    />
                </label>
                <button type="submit" className="botao">
                    {editandoId ? 'Salvar' : 'Adicionar'}
                </button>
                {editandoId && (
                    <button
                        type="button"
                        onClick={limparFormulario}
                        className="botao-secundario"
                    >
                        Cancelar
                    </button>
                )}
            </form>

            {/* Sem alunos: mostra uma mensagem em vez de uma lista vazia */}
            {alunos.length === 0 && (
                <p className="lista-vazia">Ainda não há alunos. Adicione o primeiro acima.</p>
            )}

            {/* Lista de alunos; o que está a ser editado ganha um contorno laranja */}
            <ul className="flex flex-col gap-3">
                {alunos.map((aluno) => (
                    <li
                        key={aluno.id}
                        className={`cartao py-4 flex flex-wrap justify-between items-center gap-3 ${
                            aluno.id === editandoId ? 'border-laranja' : ''
                        }`}
                    >
                        <span>
                            <strong>{aluno.nome}</strong> - {aluno.idade} anos - Responsável: {aluno.contatoResponsavel}
                        </span>
                        <div className="flex gap-2">
                            {/* aria-label: o leitor de ecrã diz "Editar Maria Silva" e não só "Editar" */}
                            <button
                                onClick={() => iniciarEdicao(aluno)}
                                aria-label={`Editar ${aluno.nome}`}
                                className="acao bg-menta text-menta-texto hover:bg-verde hover:text-white"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(aluno.id)}
                                aria-label={`Remover ${aluno.nome}`}
                                className="acao bg-rosa text-rosa-texto hover:bg-rosa-texto hover:text-white"
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
