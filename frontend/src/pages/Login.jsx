import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Tela inicial: serve para entrar e também para criar conta.
// modoRegisto alterna entre os dois modos usando o mesmo formulário.
function Login() {
  const [modoRegisto, setModoRegisto] = useState(false); // false = login, true = criar conta
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault(); // impede o navegador de recarregar a página
    setErro(null);

    if (modoRegisto) {
      // Criar conta; se der certo, volta para o modo login
      api.post('/registo', { email, senha })
        .then(() => {
          setModoRegisto(false);
          setErro(null);
          alert('Conta criada! Agora faça login.');
        })
        // Mostra a mensagem do backend (email inválido, senha curta, email já cadastrado);
        // se não houver, usa uma genérica
        .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível criar a conta'));
    } else {
      // Login: guarda o token no navegador (usado depois em api.js) e abre a app
      api.post('/login', { email, senha })
        .then((res) => {
          localStorage.setItem('token', res.data.token);
          navigate('/dashboard');
        })
        .catch((err) => setErro(err.response?.data?.erro || 'Não foi possível ligar ao servidor'));
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-lg w-80 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-white text-center">Dionakids</h1>
        <p className="text-slate-400 text-center text-sm">
          {modoRegisto ? 'Criar nova conta' : 'Entrar'}
        </p>

        {erro && <p className="text-red-400 text-sm">{erro}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-slate-700 text-white p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="bg-slate-700 text-white p-2 rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-bold"
        >
          {modoRegisto ? 'Criar conta' : 'Entrar'}
        </button>

        {/* Alterna entre "entrar" e "criar conta" */}
        <button
          type="button"
          onClick={() => { setModoRegisto(!modoRegisto); setErro(null); }}
          className="text-blue-400 text-sm hover:underline"
        >
          {modoRegisto ? 'Já tenho conta, fazer login' : 'Ainda não tenho conta, criar uma'}
        </button>
      </form>
    </div>
  );
}

export default Login;