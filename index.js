// ============================================================
// Servidor da API do Dionakids (Express + Prisma + PostgreSQL)
// Todas as rotas, exceto /registo e /login, exigem um token JWT.
// ============================================================

const express = require('express');
const bcrypt = require('bcrypt');           // gera e compara hashes de senha
const jwt = require('jsonwebtoken');        // cria e valida os tokens de login
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();          // cliente para falar com o banco de dados
const cors = require('cors');
const app = express();
app.use(cors());            // permite que o frontend (outra porta) chame esta API
app.use(express.json());    // converte o corpo JSON dos pedidos em req.body

// Sem corpo no pedido, o Express deixa req.body como undefined.
// Garante um objeto vazio para as rotas poderem ler os campos sem rebentar.
app.use((req, res, next) => {
    req.body = req.body || {};
    next();
});

// Corre em todas as rotas com ":id" na URL, antes da rota em si.
// Recusa ids que não sejam números inteiros positivos (ex.: /cursos/abc).
const ID_MAXIMO = 2147483647; // maior valor que cabe numa coluna Int do PostgreSQL
app.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > ID_MAXIMO) {
        return res.status(400).json({ erro: 'Id inválido' });
    }
    next();
});


// Middleware de autenticação: corre antes das rotas protegidas.
// Espera o cabeçalho "Authorization: Bearer <token>".
// Se o token for válido, guarda o id do usuário em req.usuarioId e segue para a rota.
function VerificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1]; // "Bearer abc123" -> "abc123"
    try {
        // Lança erro se o token foi alterado ou já expirou
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = payload.id;
        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

// Códigos de erro do Prisma usados abaixo:
//   P2002 -> violação de valor único (ex.: registo duplicado)
//   P2003 -> violação de chave estrangeira (o registo ainda é usado por outra tabela)
//   P2025 -> registo não encontrado


// ==================== VALIDAÇÃO ====================
// Funções pequenas usadas pelas rotas para conferir os dados antes de ir ao banco.

// true se for um texto com pelo menos um caractere que não seja espaço
function textoValido(valor) {
    return typeof valor === 'string' && valor.trim() !== '';
}

// Converte para número. Devolve NaN se vier vazio, null ou algo que não é número,
// porque Number('') e Number(null) dariam 0 e passariam por valores válidos.
function paraNumero(valor) {
    if (typeof valor === 'number') return valor;
    if (textoValido(valor)) return Number(valor);
    return NaN;
}

// Confere os campos de um curso. Devolve { erro } se algo estiver errado,
// ou { dados } já prontos para gravar.
function validarCurso(body) {
    const { nome, faixaEtaria } = body;
    const preco = paraNumero(body.preco);

    if (!textoValido(nome) || !textoValido(faixaEtaria)) {
        return { erro: 'Nome e faixa etária são obrigatórios' };
    }
    if (!Number.isFinite(preco) || preco < 0) {
        return { erro: 'Preço tem de ser um número igual ou maior que zero' };
    }
    return { dados: { nome: nome.trim(), faixaEtaria: faixaEtaria.trim(), preco } };
}


// ==================== CURSOS ====================

// Lista todos os cursos
app.get('/cursos', VerificarToken, async (req, res) => {
    const cursos = await prisma.curso.findMany();
    res.json(cursos);
});

// Cria um novo curso
app.post('/cursos', VerificarToken, async (req, res) => {
    const { erro, dados } = validarCurso(req.body);
    if (erro) {
        return res.status(400).json({ erro }); // 400 = dados inválidos
    }
    try {
        const curso = await prisma.curso.create({ data: dados });
        res.status(201).json(curso); // 201 = criado
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar o curso.' });
    }
});

// Atualiza um curso existente pelo id
app.put('/cursos/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    const { erro, dados } = validarCurso(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    try {
        const curso = await prisma.curso.update({
            where: { id: Number(id) }, // o id da URL chega como texto
            data: dados,
        });
        res.json(curso);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Curso não encontrado.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar o curso.' });
    }
});

// Remove um curso (só é possível se não tiver turmas)
app.delete('/cursos/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.curso.delete({ where: { id: Number(id) } });
        res.status(204).send(); // 204 = sucesso, sem conteúdo na resposta
    } catch (err) {
        if (err.code === 'P2003') {
            return res.status(409).json({
                erro: 'Este curso tem turmas associadas. Remova as turmas primeiro.',
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Curso não encontrado.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao remover o curso.' });
    }
});


// ==================== TURMAS ====================

// Lista todas as turmas, já com os dados do curso de cada uma
app.get('/turmas', VerificarToken, async (req, res) => {
    const turmas = await prisma.turma.findMany({ include: { curso: true } });
    res.json(turmas);
});

// Cria uma turma ligada a um curso
app.post('/turmas', VerificarToken, async (req, res) => {
    const { horario, professor, cursoId } = req.body;
    const turma = await prisma.turma.create({
        data: { horario, professor, cursoId: Number(cursoId) },
    });
    res.status(201).json(turma);
});

// Atualiza uma turma existente pelo id
app.put('/turmas/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    const { horario, professor, cursoId } = req.body;
    const turma = await prisma.turma.update({
        where: { id: Number(id) },
        data: { horario, professor, cursoId: Number(cursoId) },
    });
    res.json(turma);
});

// Remove uma turma (só é possível se não tiver alunos matriculados)
app.delete('/turmas/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.turma.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (err) {
        if (err.code === 'P2003') {
            return res.status(409).json({
                erro: 'Esta turma tem alunos matriculados. Cancele as matrículas primeiro.',
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Turma não encontrada.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao remover a turma.' });
    }
});


// ==================== ALUNOS ====================

// Lista todos os alunos
app.get('/alunos', VerificarToken, async (req, res) => {
    try {
        const alunos = await prisma.aluno.findMany();
        res.json(alunos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar alunos' });
    }
});

// Cria um aluno (a idade não pode ser negativa)
app.post('/alunos', VerificarToken, async (req, res) => {
    try {
        const { nome, idade, contatoResponsavel } = req.body;

        if (Number(idade) < 0) {
            return res.status(400).json({ erro: 'Idade não pode ser negativa' });
        }

        const aluno = await prisma.aluno.create({
            data: { nome, idade: Number(idade), contatoResponsavel },
        });
        res.status(201).json(aluno);
    } catch (err) {
        console.error(err);
        res.status(400).json({ erro: 'Não foi possível criar o aluno' });
    }
});

// Atualiza um aluno existente pelo id
app.put('/alunos/:id', VerificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, idade, contatoResponsavel } = req.body;

        if (Number(idade) < 0) {
            return res.status(400).json({ erro: 'Idade não pode ser negativa' });
        }

        const aluno = await prisma.aluno.update({
            where: { id: Number(id) },
            data: { nome, idade: Number(idade), contatoResponsavel },
        });
        res.json(aluno);
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Aluno não encontrado.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar o aluno.' });
    }
});

// Remove um aluno (só é possível se não tiver matrículas)
app.delete('/alunos/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.aluno.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (err) {
        if (err.code === 'P2003') {
            return res.status(409).json({
                erro: 'Este aluno tem matrículas. Cancele as matrículas primeiro.',
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Aluno não encontrado.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao remover o aluno.' });
    }
});


// ==================== MATRÍCULAS ====================
// Uma matrícula liga um aluno a uma turma.

// Matricula um aluno numa turma
app.post('/matriculas', VerificarToken, async (req, res) => {
    try {
        const { alunoId, turmaId } = req.body;
        const matricula = await prisma.matricula.create({
            data: { alunoId: Number(alunoId), turmaId: Number(turmaId) },
        });
        res.status(201).json(matricula);
    } catch (err) {
        // O par (alunoId, turmaId) é único no banco, então repetir dá P2002
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este aluno já está matriculado nesta turma' });
        }
        console.error(err);
        res.status(400).json({ erro: 'Não foi possível matricular o aluno' });
    }
});

// Lista as matrículas com o aluno, a turma e o curso da turma
app.get('/matriculas', VerificarToken, async (req, res) => {
    try {
        const matriculas = await prisma.matricula.findMany({
            include: {
                aluno: true,
                turma: { include: { curso: true } },
            },
        });
        res.json(matriculas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar matrículas' });
    }
});

// Cancela (apaga) uma matrícula
app.delete('/matriculas/:id', VerificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.matricula.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(404).json({ erro: 'Matrícula não encontrada' });
    }
});


// ==================== AUTENTICAÇÃO ====================
// Estas rotas são públicas (sem VerificarToken).

// Cria uma conta nova. A senha nunca é guardada em texto puro, só o hash.
app.post('/registo', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const senhaHash = await bcrypt.hash(senha, 10); // 10 = custo do hash
        const usuario = await prisma.usuario.create({
            data: { email, senha: senhaHash },
        });
        // Devolve só id e email, nunca a senha
        res.status(201).json({ id: usuario.id, email: usuario.email });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este email já está cadastrado' });
        }
        console.error(err);
        res.status(400).json({ erro: 'Não foi possível registrar o usuário' });
    }
});

// Faz login: confere email e senha e devolve um token JWT válido por 7 dias
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        // A mesma mensagem para email e senha errados, para não revelar quais emails existem
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});


// ==================== ERROS ====================
// Middleware de erro: tem de ficar depois de todas as rotas.
// Apanha qualquer erro que não foi tratado numa rota e responde em JSON,
// em vez da página HTML com stack trace que o Express devolve por padrão.
app.use((err, req, res, next) => {
    // Erro do express.json() quando o corpo do pedido não é JSON válido
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo do pedido' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Inicia o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
