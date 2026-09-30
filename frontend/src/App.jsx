import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RotaPrivada from './components/RotaPrivada';
import Login from './pages/Login';
import Cursos from './pages/Cursos';
import Turmas from './pages/Turmas';
import Alunos from './pages/Alunos';
import Matriculas from './pages/Matriculas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<RotaPrivada><Layout /></RotaPrivada>}>
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/turmas" element={<Turmas />} />
          <Route path="/alunos" element={<ALunos />} />
          <Route path="/matriculas" element={<Matriculas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;