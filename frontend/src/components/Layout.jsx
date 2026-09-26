import { Link, Outlet } from 'react-router-dom';

function Layout() {
    return (
        <div className="min-h-screen bg-slate-900">
            <nav className="bg-slate-800 px-6 py-4 flex gap-6">
                <Link to="/cursos" className="text-white hover:text-blue-400">Cursos</Link>
                <Link to="/Turmas" className="text-white hover:text-blue-400">Turmas</Link>
                <Link to="/Alunos" className="text-white hover:text-blue-400">Alunos</Link>
                <Link to="/Matriculas" className="text-white hover:text-blue-400">Matrículas</Link>
            </nav>
            <main className="p-6">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;