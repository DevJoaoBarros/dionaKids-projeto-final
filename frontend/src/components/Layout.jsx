import { Link, Outlet, useNavigate } from 'react-router-dom';

// Estrutura comum das páginas protegidas: barra de navegação + conteúdo da página
function Layout() {
  const navigate = useNavigate();

  // Sair = apagar o token e voltar para o login
  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 px-6 py-4 flex gap-6 items-center">
        <Link to="/dashboard" className="text-white hover:text-blue-400">Dashboard</Link>
        <Link to="/cursos" className="text-white hover:text-blue-400">Cursos</Link>
        <Link to="/turmas" className="text-white hover:text-blue-400">Turmas</Link>
        <Link to="/alunos" className="text-white hover:text-blue-400">Alunos</Link>
        <Link to="/matriculas" className="text-white hover:text-blue-400">Matrículas</Link>
        <button
          onClick={handleLogout}
          className="text-white hover:text-red-400 ml-auto"
        >
          Sair
        </button>
      </nav>
      <main className="p-6">
        {/* Outlet é onde aparece a página da rota atual (Cursos, Turmas, ...) */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
