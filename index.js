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
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');                 // lê ficheiros .yaml
const swaggerUi = require('swagger-ui-express'); // mostra a documentação da API como página 
const app = express();
app.use(cors());            // permite que o frontend (outra porta) chame esta API
app.use(express.json());    // converte o corpo JSON dos pedidos em req.body

// Sem corpo no pedido, o Express deixa req.body como undefined.
// Garante um objeto vazio para as rotas poderem ler os campos sem rebentar.
app.use((req, res, next) => {
    req.body = req.body || {};
    next();
});

// Documentação da API em http://localhost:3000/docs (pública, não precisa de token)
const documentacao = yaml.load(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(documentacao));

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
    } catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}

// Protege estas rotas antes de tudo (incluindo a validação do :id).
// Assim, sem token responde sempre 401, mesmo com um id inválido.
app.use(['/cursos', '/turmas', '/alunos', '/matriculas', '/dashboard'], VerificarToken);

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

// true se for um id possível: número inteiro entre 1 e o máximo de uma coluna Int
function idValido(numero) {
    return Number.isInteger(numero) && numero >= 1 && numero <= ID_MAXIMO;
}

// Confere os campos de uma turma (mesmo formato de resposta do validarCurso)
function validarTurma(body) {
    const { horario, professor } = body;
    const cursoId = paraNumero(body.cursoId);

    if (!textoValido(horario) || !textoValido(professor)) {
        return { erro: 'Horário e professor são obrigatórios' };
    }
    if (!idValido(cursoId)) {
        return { erro: 'Escolha um curso válido' };
    }
    return { dados: { horario: horario.trim(), professor: professor.trim(), cursoId } };
}

// Confere os campos de um aluno (mesmo formato de resposta do validarCurso)
const IDADE_MAXIMA = 120;
function validarAluno(body) {
    const { nome, contatoResponsavel } = body;
    const idade = paraNumero(body.idade);

    if (!textoValido(nome) || !textoValido(contatoResponsavel)) {
        return { erro: 'Nome e contacto do responsável são obrigatórios' };
    }
    // Number.isInteger recusa 5.5 e NaN; antes, 5.5 era gravado como 5 sem aviso
    if (!Number.isInteger(idade) || idade < 0 || idade > IDADE_MAXIMA) {
        return { erro: `Idade tem de ser um número inteiro entre 0 e ${IDADE_MAXIMA}` };
    }
    return { dados: { nome: nome.trim(), idade, contatoResponsavel: contatoResponsavel.trim() } };
}


// ==================== CURSOS ====================

// Lista todos os cursos
app.get('/cursos', async (req, res) => {
    try{
        const cursos = await prisma.curso.findMany();
        res.json(cursos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao obter os cursos' });
    }
});

// Cria um novo curso
app.post('/cursos', async (req, res) => {
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
app.put('/cursos/:id', async (req, res) => {
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
app.delete('/cursos/:id', async (req, res) => {
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
app.get('/turmas', async (req, res) => {
    try {
        const turmas = await prisma.turma.findMany({ include: { curso: true } });
        res.json(turmas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao obter as turmas' });
    }
});

// Cria uma turma ligada a um curso
app.post('/turmas', async (req, res) => {
    const { erro, dados } = validarTurma(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    try {
        const turma = await prisma.turma.create({ data: dados });
        res.status(201).json(turma);
    } catch (err) {
        // Aqui P2003 quer dizer que o cursoId não existe na tabela de cursos
        if (err.code === 'P2003') {
            return res.status(400).json({ erro: 'O curso escolhido não existe.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar a turma.' });
    }
});

// Atualiza uma turma existente pelo id
app.put('/turmas/:id', async (req, res) => {
    const { id } = req.params;
    const { erro, dados } = validarTurma(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    try {
        const turma = await prisma.turma.update({
            where: { id: Number(id) },
            data: dados,
        });
        res.json(turma);
    } catch (err) {
        if (err.code === 'P2003') {
            return res.status(400).json({ erro: 'O curso escolhido não existe.' });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Turma não encontrada.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao atualizar a turma.' });
    }
});

// Remove uma turma (só é possível se não tiver alunos matriculados)
app.delete('/turmas/:id', async (req, res) => {
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
app.get('/alunos', async (req, res) => {
    try {
        const alunos = await prisma.aluno.findMany();
        res.json(alunos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao obter os alunos' });
    }
});

// Cria um aluno
app.post('/alunos', async (req, res) => {
    const { erro, dados } = validarAluno(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    try {
        const aluno = await prisma.aluno.create({ data: dados });
        res.status(201).json(aluno);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao criar o aluno.' });
    }
});

// Atualiza um aluno existente pelo id
app.put('/alunos/:id', async (req, res) => {
    const { id } = req.params;
    const { erro, dados } = validarAluno(req.body);
    if (erro) {
        return res.status(400).json({ erro });
    }
    try {
        const aluno = await prisma.aluno.update({
            where: { id: Number(id) },
            data: dados,
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
app.delete('/alunos/:id', async (req, res) => {
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
app.post('/matriculas', async (req, res) => {
    const alunoId = paraNumero(req.body.alunoId);
    const turmaId = paraNumero(req.body.turmaId);
    if (!idValido(alunoId) || !idValido(turmaId)) {
        return res.status(400).json({ erro: 'Escolha um aluno e uma turma válidos' });
    }
    try {
        const matricula = await prisma.matricula.create({
            data: { alunoId, turmaId },
        });
        res.status(201).json(matricula);
    } catch (err) {
        // O par (alunoId, turmaId) é único no banco, então repetir dá P2002
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este aluno já está matriculado nesta turma' });
        }
        // Aqui P2003 quer dizer que o aluno ou a turma não existem
        if (err.code === 'P2003') {
            return res.status(400).json({ erro: 'O aluno ou a turma escolhidos não existem.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao matricular o aluno.' });
    }
});

// Lista as matrículas com o aluno, a turma e o curso da turma
app.get('/matriculas', async (req, res) => {
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
        res.status(500).json({ erro: 'Erro ao obter as matrículas' });
    }
});

// Cancela (apaga) uma matrícula
app.delete('/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.matricula.delete({ where: { id: Number(id) } });
        res.status(204).send();
    } catch (err) {
        // Só responde 404 quando a matrícula realmente não existe;
        // qualquer outra falha (ex.: banco fora do ar) é 500.
        if (err.code === 'P2025') {
            return res.status(404).json({ erro: 'Matrícula não encontrada.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao cancelar a matrícula.' });
    }
});


// ==================== AUTENTICAÇÃO ====================
// Estas rotas são públicas (sem VerificarToken).

// Formato básico de email: algo@algo.algo, sem espaços
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 8; // número mínimo de caracteres da senha

// Cria uma conta nova. A senha nunca é guardada em texto puro, só o hash.
app.post('/registo', async (req, res) => {
    const { senha } = req.body;
    if (!textoValido(req.body.email) || !FORMATO_EMAIL.test(req.body.email.trim())) {
        return res.status(400).json({ erro: 'Email inválido' });
    }
    if (typeof senha !== 'string' || senha.length < SENHA_MINIMA) {
        return res.status(400).json({ erro: `A palavra-passe tem de ter pelo menos ${SENHA_MINIMA} caracteres` });
    }
    const email = req.body.email.trim().toLowerCase();
    try {
        const senhaHash = await bcrypt.hash(senha, 10); // 10 = custo do hash
        const usuario = await prisma.usuario.create({
            data: { email, senha: senhaHash },
        });
        // Devolve só id e email, nunca a senha
        res.status(201).json({ id: usuario.id, email: usuario.email });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este email já está registado' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro ao registar o utilizador.' });
    }
});

// Faz login: confere email e senha e devolve um token JWT válido por 7 dias
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!textoValido(email) || !textoValido(senha)) {
        return res.status(400).json({ erro: 'Email e palavra-passe são obrigatórios' });
    }
    try {
        const usuario = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
        // A mesma mensagem para email e senha errados, para não revelar quais emails existem
        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou palavra-passe inválidos' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou palavra-passe inválidos' });
        }
        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao iniciar sessão' });
    }
});

// ==================== DASHBOARD ====================

// Resumo geral: totais de cada entidade e, por curso, quantas turmas e alunos tem
app.get('/dashboard', async (req, res) => {
    try {
        // Promise.all faz as 5 consultas ao mesmo tempo, em vez de uma de cada vez
        const [totalCursos, totalTurmas, totalAlunos, totalMatriculas, cursos] = await Promise.all([
            prisma.curso.count(),
            prisma.turma.count(),
            prisma.aluno.count(),
            prisma.matricula.count(),
            prisma.curso.findMany({
                orderBy: { nome: 'asc' },
                include: {
                    turmas: {
                        include: { matriculas: { select: { alunoId: true } } },                    
                    },
                },
            }),
        ]);

        // Para cada curso, conta os alunos diferentes matriculados nas suas turmas.
        // O set ignora repetidos: um aluno em duas turmas do mesmo curso conta uma vez.
        const porCurso = cursos.map((curso) => {
            const alunos = new Set();
            curso.turmas.forEach((turma) => {
                turma.matriculas.forEach((m) => alunos.add(m.alunoId));
            });
            return {
                id: curso.id,
                nome: curso.nome,
                turmas: curso.turmas.length,
                alunos: alunos.size,
            };
        });

        res.json({
            totais: {
                cursos: totalCursos,
                turmas: totalTurmas,
                alunos: totalAlunos,
                matriculas: totalMatriculas,
            },
            porCurso,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao carregar o dashboard.' });
    }
});

// Qualquer pedido que não correspondeu a nenhuma rota acima
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada'});
});

// ==================== ERROS ====================
// Middleware de erro: tem de ficar depois de todas as rotas.
// Apanha qualquer erro que não foi tratado numa rota e responde em JSON,
// em vez da página HTML com stack trace que o Express devolve por padrão.
app.use((err, req, res, _next) => {
    // Erro do express.json() quando o corpo do pedido não é JSON válido
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo do pedido' });
    }
    console.error(err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
});

// Inicia o servidor só quando o ficheiro é executado diretamente (node index.js).
// Nos testes, o ficheiro é importado com require() e o servidor não arranca:
// o Supertest chama a app diretamente, sem precisar de uma porta.
if (require.main === module) {
    app.listen(3000, () => {
        console.log('Servidor rodando na porta 3000');
    });
}

// Exporta a app para os testes
module.exports = app;
