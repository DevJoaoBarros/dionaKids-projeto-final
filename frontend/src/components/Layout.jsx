import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from './Logo';

//Links do menu: caminho e texto de cada página
const links = [
  { para: '/dashboard', texto: 'Dashboard' },
  { para: '/cursos', texto: 'Curos' },
  { para: '/turmas', texto: 'Turmas' },
  { para: '/alunos', texto: 'Alunos' },
  { para: 'mtriculas', texto: 'Matrículas' },
];

// NavLink da "isActive" = true quando o link é a página aberta:
// a página atual fica com o fundo escuro,as outras ficam simples
function classeDoLink({ isActive }) {
  const base = 'px-4 py-2 rounded-full font-bold';
  return isActive
    ? `${base} bg-tinta text-creme`
    : `${base} text-tinta hover:bg-pessego`;
}

// Estrutura comum das páginas protegidas: barra de navegação + conteúdo da página
function Layout() {
  const navigate = useNavigate();

  // Sair = apagar o token e voltar para o login
  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/');
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto px-4 pt-5">
        {/* flex-wrap: em ecrãs pequenos os links passam a linha de baixo */}
        <nav className="bg-white border-2 border-areia rounded-3xl p-2 pl-4 flex flex-wrap items-center gap-1">
          <div className="mr-4">
            <Logo />
          </div>
          {links.map((link) => (
            <NavLink key={link.para} to={link.para} className={classeDoLink}>
              {link.texto}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="botao-secundário ml-auto">
            Sair
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Outlet é onde aparece a página da rota atual (Cursos, Turmas, ...) */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout