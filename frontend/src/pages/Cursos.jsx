import { useEffect, useState } from 'react';
import api from '../api';

function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [erro, setErro] = useState(null);
  const [nome, setNome] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [preco, setPreco] = useState('');
  const [editandoId, setEditandoId] = useState(null); // null = modo criar

  function carregarCursos() {
    api.get('/cursos')
      .then((res) => setCursos(res.data))
      .catch(() => setErro('Não foi possível carregar os cursos'));
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  function limparFormulario() {
    setNome('');
    setFaixaEtaria('');
    setPreco('');
    setEditandoId(null);
  }

  function iniciarEdicao(curso) {
    setNome(curso.nome);
    setFaixaEtaria(curso.faixaEtaria);
    setPreco(String(curso.preco)); // o input guarda texto
    setEditandoId(curso.id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    const dados = { nome, faixaEtaria, preco: Number(preco) };

    const pedido = editandoId
      ? api.put(`/cursos/${editandoId}`, dados)
      : api.post('/cursos', dados);

    pedido
      .then(() => {
        limparFormulario();
        carregarCursos();
      })
      .catch((err) => setErro(err.response?.data?.erro || (editandoId
        ? 'Não foi possível atualizar o curso'
        : 'Não foi possível criar o curso')));
  }

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