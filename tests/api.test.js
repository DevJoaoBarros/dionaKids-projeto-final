// Testes automatizados da API (Jest + Supertest).
// O Prisma é substituído por uma versão falsa (mock): os testes não precisam de
// base de dados e cada teste decide o que o "banco" responde.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Segredo usado só nos testes, para criar e validar tokens
process.env.JWT_SECRET = 'segredo-de-teste';

// Prisma falso: cada função é um jest.fn() que os testes configuram
const mockPrisma = {
    curso: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    turma: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    aluno: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    matricula: { findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
    usuario: { create: jest.fn(), findUnique: jest.fn() },
};

// Quando o index.js fizer require('@prisma/client'), recebe o Prisma falso
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

// Importa a app (o servidor não arranca, ver o fim do index.js)
const app = require('../index');

// Cria um erro igual aos que o Prisma lança (P2002, P2003, P2025...)
function erroPrisma(code) {
    const err = new Error(`Erro simulado do Prisma ${code}`);
    err.code = code;
    return err;
}

// Token válido para as rotas protegidas
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

// Antes de cada teste, limpa as configurações do teste anterior
beforeEach(() => {
    jest.clearAllMocks();
});

// O index.js regista os erros com console.error; esconde-os para não poluir a saída
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// ==================== AUTENTICAÇÃO ====================

describe('Autenticação', () => {
    test('registo com dados válidos cria a conta (201) sem devolver a senha', async () => {
        mockPrisma.usuario.create.mockResolvedValue({ id: 1, email: 'novo@dionakids.com', senha: 'hash' });

        const res = await request(app)
            .post('/registo')
            .send({ email: 'Novo@DionaKids.com', senha: 'senha12345' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id: 1, email: 'novo@dionakids.com' });
        // O email é guardado em minúsculas e a senha nunca em texto puro
        const dadosGravados = mockPrisma.usuario.create.mock.calls[0][0].data;
        expect(dadosGravados.email).toBe('novo@dionakids.com');
        expect(dadosGravados.senha).not.toBe('senha12345');
    });

    test('registo com senha curta é recusado (400)', async () => {
        const res = await request(app)
            .post('/registo')
            .send({ email: 'novo@dionakids.com', senha: '123' });

        expect(res.status).toBe(400);
        expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
    });

    test('registo com email já existente devolve 409', async () => {
        mockPrisma.usuario.create.mockRejectedValue(erroPrisma('P2002'));

        const res = await request(app)
            .post('/registo')
            .send({ email: 'admin@dionakids.com', senha: 'senha12345' });

        expect(res.status).toBe(409);
    });

    test('login com credenciais certas devolve um token válido', async () => {
        const senhaHash = await bcrypt.hash('senha123', 10);
        mockPrisma.usuario.findUnique.mockResolvedValue({ id: 1, email: 'admin@dionakids.com', senha: senhaHash });

        const res = await request(app)
            .post('/login')
            .send({ email: 'admin@dionakids.com', senha: 'senha123' });

        expect(res.status).toBe(200);
        const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
        expect(payload.id).toBe(1);
    });

    test('login com senha errada devolve 401', async () => {
        const senhaHash = await bcrypt.hash('senha123', 10);
        mockPrisma.usuario.findUnique.mockResolvedValue({ id: 1, email: 'admin@dionakids.com', senha: senhaHash });

        const res = await request(app)
            .post('/login')
            .send({ email: 'admin@dionakids.com', senha: 'errada' });

        expect(res.status).toBe(401);
        expect(res.body.token).toBeUndefined();
    });

    test('rota protegida sem token devolve 401', async () => {
        const res = await request(app).get('/cursos');

        expect(res.status).toBe(401);
        expect(mockPrisma.curso.findMany).not.toHaveBeenCalled();
    });

    test('rota protegida com token inválido devolve 401', async () => {
        const res = await request(app)
            .get('/cursos')
            .set('Authorization', 'Bearer token-falso');

        expect(res.status).toBe(401);
    });
});

// ==================== CURSOS ====================

describe('Cursos', () => {
    test('GET /cursos devolve a lista', async () => {
        mockPrisma.curso.findMany.mockResolvedValue([
            { id: 1, nome: 'DionaKidz', faixaEtaria: '7-10', preco: 220 },
        ]);

        const res = await request(app).get('/cursos').set(auth);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].nome).toBe('DionaKidz');
    });

    test('POST /cursos com dados válidos cria o curso (201)', async () => {
        mockPrisma.curso.create.mockImplementation(({ data }) => Promise.resolve({ id: 5, ...data }));

        const res = await request(app)
            .post('/cursos')
            .set(auth)
            .send({ nome: 'DionaDevz', faixaEtaria: '12-16', preco: 199.99 });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: 5, nome: 'DionaDevz', preco: 199.99 });
    });

    test('POST /cursos com preço negativo é recusado (400)', async () => {
        const res = await request(app)
            .post('/cursos')
            .set(auth)
            .send({ nome: 'X', faixaEtaria: '7-10', preco: -50 });

        expect(res.status).toBe(400);
        expect(mockPrisma.curso.create).not.toHaveBeenCalled();
    });

    test('PUT /cursos/:id de um curso inexistente devolve 404', async () => {
        mockPrisma.curso.update.mockRejectedValue(erroPrisma('P2025'));

        const res = await request(app)
            .put('/cursos/999')
            .set(auth)
            .send({ nome: 'X', faixaEtaria: '7-10', preco: 100 });

        expect(res.status).toBe(404);
    });

    test('DELETE /cursos/:id de um curso com turmas devolve 409', async () => {
        mockPrisma.curso.delete.mockRejectedValue(erroPrisma('P2003'));

        const res = await request(app).delete('/cursos/1').set(auth);

        expect(res.status).toBe(409);
        expect(res.body.erro).toMatch(/turmas/);
    });

    test('id que não é número devolve 400', async () => {
        const res = await request(app).delete('/cursos/abc').set(auth);

        expect(res.status).toBe(400);
        expect(mockPrisma.curso.delete).not.toHaveBeenCalled();
    });
});

// ==================== ALUNOS E MATRÍCULAS ====================

describe('Alunos e matrículas', () => {
    test('POST /alunos com idade decimal é recusado (400)', async () => {
        const res = await request(app)
            .post('/alunos')
            .set(auth)
            .send({ nome: 'Ana', idade: 5.5, contatoResponsavel: '912 345 678' });

        expect(res.status).toBe(400);
        expect(mockPrisma.aluno.create).not.toHaveBeenCalled();
    });

    test('matrícula duplicada devolve 409', async () => {
        mockPrisma.matricula.create.mockRejectedValue(erroPrisma('P2002'));

        const res = await request(app)
            .post('/matriculas')
            .set(auth)
            .send({ alunoId: 1, turmaId: 1 });

        expect(res.status).toBe(409);
    });
});

// ==================== OUTROS ====================

describe('Respostas gerais', () => {
    test('rota inexistente devolve 404 em JSON', async () => {
        const res = await request(app).get('/nao-existe');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ erro: 'Rota não encontrada' });
    });

    test('JSON malformado devolve 400 em JSON', async () => {
        const res = await request(app)
            .post('/login')
            .set('Content-Type', 'application/json')
            .send('{isto não é json');

        expect(res.status).toBe(400);
        expect(res.body.erro).toBeDefined();
    });
});

describe('Documentação da API', () => {
    test('GET /docs/ abre a página do Swagger sem precisar de token', async () => {
        const res = await request(app).get('/docs/');

        expect(res.status).toBe(200);
        expect(res.text).toContain('swagger-ui');
    });

    test('todas as rotas do index.js estão documentadas no openapi.yaml', () => {
        const fs = require('fs');
        const path = require('path');
        const yaml = require('js-yaml');

        const codigo = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
        const doc = yaml.load(fs.readFileSync(path.join(__dirname, '..', 'docs', 'openapi.yaml'), 'utf8'));

        // Encontra cada app.get('/rota'), app.post(...), etc. no código
        const rotas = [...codigo.matchAll(/app\.(get|post|put|delete)\('([^']+)'/g)];
        expect(rotas.length).toBeGreaterThan(0);

        for (const [, metodo, rota] of rotas) {
            // o Express escreve /cursos/:id e OpenAPI escreve /cursos/{id}
            const caminho = rota.replace(/:(\w+)/g, '{$1}');
            expect(doc.paths[caminho]?.[metodo]).toBeDefined();
        }
    }); 
});