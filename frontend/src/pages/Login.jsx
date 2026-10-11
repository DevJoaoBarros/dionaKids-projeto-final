import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Logo from '../components/Logo';

// Tela inicial: serve para entrar e também para criar conta.
// modoRegisto alterna entre os dois modos usando o mesmo formulário.
function Login() {
  const [modoRegisto, setModoRegisto] = useState(false); // false = login, true = criar conta
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault(); // impede o navegador de recarregar a página
    setErro(null);
    setSucesso(null);

    if (modoRegisto) {
      // Criar conta; se der certo, volta para o modo login
      api.post('/registo', { email, senha })
        .then(() => {
          setModoRegisto(false);
          setSucesso('Conta criada! Agora faça login.');
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
    <div className="min-h-screen  flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="cartao w-full max-w-sm p-8 flex flex-col gap-4">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="font-titulo text-3xl font-extrabold text-center leading-tight">
          {modoRegisto ? 'Criar nova conta' : 'Olá Bem-Vindo de volta'}
        </h1>

        {erro && <p className="mensagem-erro text-sm">{erro}</p>}
        {sucesso && <p className="bg-meta text-menta-texto. rounded-2xl p-3 text-sm font-semibold">{sucesso}</p>}
    
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="campo"
          required
        />
        <button type="submit" className="botao">
          {modoRegisto ? 'Criar conta' : 'Entrar'}
        </button>

        {/* Alterna entre "entrar" e "criar conta" */}
        <button
          type="button"
          onClick={() => { setModoRegisto(!modoRegisto); setErro(null); setSucesso(null); }}
          className="text-verde text-sm font-bold hover:underline cursor-pointer"
        >
          {modoRegisto ? 'Já tenho conta, fazer login' : 'Ainda não tenho conta, criar uma'}
        </button>
      </form>
    </div>
  );
}

export default Login;
