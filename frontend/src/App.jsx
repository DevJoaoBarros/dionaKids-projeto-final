import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RotaPrivada from './components/RotaPrivada';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cursos from './pages/Cursos';
import Turmas from './pages/Turmas';
import Alunos from './pages/Alunos';
import Matriculas from './pages/Matriculas';

// Define as rotas (páginas) da aplicação
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página pública: login e criação de conta */}
        <Route path="/" element={<Login />} />

        {/* Páginas protegidas: RotaPrivada manda para o login se não houver token,
            e Layout mostra o menu no topo com a página atual por baixo */}
        <Route element={<RotaPrivada><Layout /></RotaPrivada>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/matriculas" element={<Matriculas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
