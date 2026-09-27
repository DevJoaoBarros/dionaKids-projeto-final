import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [modoRegisto, setModoRegisto] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (modoRegisto) {
      api.post('/registo', { email, senha })
        .then(() => {
          setModoRegisto(false);
          setErro(null);
          alert('Conta criada! Agora faça login.');
        })
        .catch((err) => {
          if (err.response?.status === 409) {
            setErro('Este email já está cadastrado');
          } else {
            setErro('Não foi possível criar a conta');
          }
        });
    } else {
      api.post('/login', { email, senha })
        .then((res) => {
          localStorage.setItem('token', res.data.token);
          navigate('/cursos');
        })
        .catch(() => {
          setErro('Email ou senha inválidos');
        });
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