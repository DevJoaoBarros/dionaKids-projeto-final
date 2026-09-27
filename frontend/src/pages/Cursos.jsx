import { useEffect, useState } from 'react';
import api from '../api';

function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [erro, setErro] = useState(null);
  const [nome, setNome] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [preco, setPreco] = useState('');

  function carregarCursos() {
    api.get('/cursos')
      .then((res) => setCursos(res.data))
      .catch(() => setErro('Não foi possível carregar os cursos'));
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    api.post('/cursos', { nome, faixaEtaria, preco: Number(preco) })
      .then(() => {
        setNome('');
        setFaixaEtaria('');
        setPreco('');
        carregarCursos();
      })
      .catch(() => setErro('Não foi possível criar o curso'));
  }

  function handleDelete(id) {
    api.delete(`/cursos/${id}`)
      .then(() => carregarCursos())
      .catch(() => setErro('Não foi possível remover o curso'));
  }

  if (erro) {
    return <p className="text-red-400">{erro}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Cursos</h1>

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
          Adicionar
        </button>
      </form>

      <ul className="space-y-2">
        {cursos.map((curso) => (
          <li key={curso.id} className="bg-slate-800 p-4 rounded-lg text-white flex justify-between items-center">
            <span>
              <strong>{curso.nome}</strong> — {curso.faixaEtaria} anos — R$ {curso.preco}
            </span>
            <button
              onClick={() => handleDelete(curso.id)}
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

export default Cursos;