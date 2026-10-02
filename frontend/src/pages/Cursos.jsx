import { useEffect, useState } from 'react';
import api from '../api';

// Página de Cursos: lista, cria, edita e remove cursos.
// O mesmo formulário serve para criar e para editar (depende de editandoId).
function Cursos() {
  const [cursos, setCursos] = useState([]);   // lista vinda da API
  const [erro, setErro] = useState(null);     // mensagem de erro mostrada no topo
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [preco, setPreco] = useState('');
  const [editandoId, setEditandoId] = useState(null); // null = modo criar

  // Busca os cursos no backend e atualiza a lista
  function carregarCursos() {
    api.get('/cursos')
      .then((res) => setCursos(res.data))
      .catch(() => setErro('Não foi possível carregar os cursos'));
  }

  // [] = corre só uma vez, quando a página abre
  useEffect(() => {
    carregarCursos();
  }, []);

  // Esvazia os campos e volta ao modo "criar"
  function limparFormulario() {
    setNome('');
    setFaixaEtaria('');
    setPreco('');
    setEditandoId(null);
  }

  // Preenche o formulário com os dados do curso clicado e entra no modo "editar"
  function iniciarEdicao(curso) {
    setNome(curso.nome);
    setFaixaEtaria(curso.faixaEtaria);
    setPreco(String(curso.preco)); // o input guarda texto
    setEditandoId(curso.id);
  }

  // Envio do formulário: cria (POST) ou atualiza (PUT), conforme o modo
  function handleSubmit(e) {
    e.preventDefault(); // impede o navegador de recarregar a página
    setErro(null);
    const dados = { nome, faixaEtaria, preco: Number(preco) };

    // Com editandoId atualiza o curso existente; sem ele cria um novo
    const pedido = editandoId
      ? api.put(`/cursos/${editandoId}`, dados)
      : api.post('/cursos', dados);

    pedido
      .then(() => {
        limparFormulario();
        carregarCursos();
      })
      // Mostra a mensagem do backend; se não houver, usa uma genérica
      .catch((err) => setErro(err.response?.data?.erro || (editandoId
        ? 'Não foi possível atualizar o curso'
        : 'Não foi possível criar o curso')));
  }

  // Remove um curso. O backend recusa (409) se o curso ainda tiver turmas.
  function handleDelete(id) {
    setErro(null);
    api.delete(`/cursos/${id}`)
      .then(() => {
        if (id === editandoId) limparFormulario(); // se apagou o que estava a editar
        carregarCursos();
      })
      .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível remover o curso'));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Cursos</h1>

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
          type="text"
          placeholder="Faixa etária (ex: 7-11)"
          value={faixaEtaria}
          onChange={(e) => setFaixaEtaria(e.target.value)}
          className="bg-slate-700 text-white p-2 rounded flex-1"
          required
        />
        <input
          type="number"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="bg-slate-700 text-white p-2 rounded w-28"
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

      {/* Lista de cursos; o que está a ser editado ganha um contorno azul */}
      <ul className="space-y-2">
        {cursos.map((curso) => (
          <li
            key={curso.id}
            className={`bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center ${
              curso.id === editandoId ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <span>
              <strong>{curso.nome}</strong> - {curso.faixaEtaria} anos - R$ {curso.preco}
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => iniciarEdicao(curso)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(curso.id)}
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

export default Cursos;