import { useEffect, useState } from 'react';
import api from '../api';

// Página de Turmas: lista, cria, edita e remove turmas.
// O mesmo formulário serve para criar e para editar (depende de editandoId).
function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);   // opções do seletor de curso
    const [erro, setErro] = useState(null);     // mensagem de erro mostrada no topo
    // Campos do formulário
    const [horario, setHorario] = useState('');
    const [professor, setProfessor] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [editandoId, setEditandoId] = useState(null); // null = modo criar

    function carregarTurmas() {
        api.get('/turmas')
            .then((res) => setTurmas(res.data))
            .catch(() => setErro('Não foi possível carregar as turmas'));
    }

    function carregarCursos() {
        api.get('/cursos')
            .then((res) => setCursos(res.data))
            .catch(() => setErro('Não foi possível carregar os cursos'));
    }

    // [] = corre só uma vez, quando a página abre
    useEffect(() => {
        carregarTurmas();
        carregarCursos();
    }, []);

    // Esvazia os campos e volta ao modo "criar"
    function limparFormulario() {
        setHorario('');
        setProfessor('');
        setCursoId('');
        setEditandoId(null);
    }

    // Preenche o formulário com os dados da turma clicada e entra no modo "editar"
    function iniciarEdicao(turma) {
        setHorario(turma.horario);
        setProfessor(turma.professor);
        setCursoId(String(turma.cursoId)); // o select guarda texto
        setEditandoId(turma.id);
    }

    // Envio do formulário: cria (POST) ou atualiza (PUT), conforme o modo
    function handleSubmit(e) {
        e.preventDefault(); // impede o navegador de recarregar a página
        setErro(null);
        const dados = { horario, professor, cursoId: Number(cursoId) };

        // Com editandoId atualiza a turma existente; sem ele cria uma nova
        const pedido = editandoId
            ? api.put(`/turmas/${editandoId}`, dados)
            : api.post('/turmas', dados);

        pedido
            .then(() => {
                limparFormulario();
                carregarTurmas();
            })
            // Mostra a mensagem do backend; se não houver, usa uma genérica
            .catch((err) => setErro(err.response?.data?.erro || (editandoId
                ? 'Não foi possível atualizar a turma'
                : 'Não foi possível criar a turma')));
    }

    // Remove uma turma. O backend recusa (409) se a turma ainda tiver matrículas.
    function handleDelete(id) {
        setErro(null);
        api.delete(`/turmas/${id}`)
            .then(() => {
                if (id === editandoId) limparFormulario(); // se apagou a que estava a editar
                carregarTurmas();
            })
            .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível remover a turma'));
    }

    return (
        <div>
            <h1 className="titulo-pagina mb-5">Turmas</h1>

            {erro && (
                <p className="mensagem-erro mb-4">{erro}</p>
            )}

            <form onSubmit={handleSubmit} className="cartao flex fle-wrap gap-3 mb-6">
                <select
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    className="campo flex-1 min-w-48"
                    required
                >
                    <option value="">Selecione um curso</option>
                    {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>{curso.nome}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Horário"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="campo flex-1 min-w-48"
                    required
                />
                <input
                    type="text"
                    placeholder="Professor"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="campo flex-1 min-w-48"
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

            {/* Lista de turmas; a que está a ser editada ganha um contorno azul */}
            <ul className="flex flex-col gap-3">
                {turmas.map((turma) => (
                    <li
                        key={turma.id}
                        className={`cartao py-4 flex flex-wrap justify-between items-center gap-3 ${
                            turma.id === editandoId ? 'border-laranja' : ''
                        }`}
                    >
                        <span>
                            <strong>{turma.curso.nome}</strong> - {turma.horario} - Professor: {turma.professor}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => iniciarEdicao(turma)}
                                className="acao bg-menta text-menta-texto hover:bg-verde hover:text-white"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(turma.id)}
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

export default Turmas;