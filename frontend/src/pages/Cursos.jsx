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
      <h1 className="titulo-pagina mb-5">Cursos</h1>

      {erro && (
        <p className="mensagem-erro mb-4">{erro}</p>
      )}

      <form onSubmit={handleSubmit} className="cartao flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="campo flex-1 min-w-48"
          required
        />
        <input
          type="text"
          placeholder="Faixa etária (ex: 7-11)"
          value={faixaEtaria}
          onChange={(e) => setFaixaEtaria(e.target.value)}
          className="campo flex-1 min-w-48"
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Preço"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="campo w-28"
          required
        />
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

      {/* Lista de cursos; o que está a ser editado ganha um contorno laranja */}
      <ul className="flex flex-col gap-3">
        {cursos.map((curso) => (
          <li
            key={curso.id}
            className={`cartao py-4 flex flex-wrap justify-between items-center gap-3 ${
              curso.id === editandoId ? 'border-laranja' : ''
            }`}
          >
            <span>
              <strong>{curso.nome}</strong> - {curso.faixaEtaria} anos - € {curso.preco}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => iniciarEdicao(curso)}
                className="acao bg-menta text-menta-texto hover:bg-verde hover:text-white"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(curso.id)}
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

export default Cursos;