const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cors = require('cors');
const app = express();
app.use(cors());


function VerificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ erro: ' Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = payload.id;
        next();
    }   catch (err) {
        return req.status(401).json({ erro: 'Token iválido ou expirado' });
    }
}


app.get('/cursos', VerificarToken, async (req, res) => {
    const cursos = await prisma.curso.findMany();
    res.json(cursos);
});

app.use(express.json());

app.post('/cursos', VerificarToken, async (req,res) => {
    const { nome, faixaEtaria, preco} = req.body;
    const curso = await prisma.curso.create({
        data: { nome, faixaEtaria, preco},
    });
    res.status(201).json(curso);
});

app.put('/cursos/:id', VerificarToken, async (req,res) => {
    const { id } = req.params;
    const { nome, faixaEtaria, preco } = req.body;
    const curso = await prisma.curso.update({
        where: { id: Number(id)},
        data: { nome, faixaEtaria, preco },
    });
    res.json(curso);
});

app.delete('/cursos/:id', VerificarToken, async (req,res) => {
    const { id } = req.params;
    await prisma.curso.delete({ where: { id: Number(id) } });
    res.status(204).send();
});

app.get('/turmas', VerificarToken, async (req, res) => {
    const turmas = await prisma.turma.findMany({ include: { curso: true }});
    res.json(turmas);
});

app.post('/turmas', VerificarToken, async (req, res) => {
    const { horario, professor, cursoId } = req.body;
    const turma = await prisma.turma.create({
        data: { horario, professor, cursoId: Number(cursoId) },
    });
    res.status(201).json(turma);
});

app.put('/turmas/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    const { horario, professor, cursoId } = req.body;
    const turma= await prisma.turma.update({
        where: { id: Number(id) },
        data: { horario, professor, cursoId: Number(cursoId) },  
    });
    res.json(turma);
});

app.delete('/turmas/:id', VerificarToken, async (req, res) => {
    const { id } = req.params;
    await prisma.turma.delete({ where: { id: Number(id) } });
    res.status(204).send();
});

app.get('/alunos', VerificarToken, async (req, res) => {
    try {
        const alunos = await prisma.aluno.findMany();
        res.json(alunos);
    }   catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar alunos' });
    }
});

app.post('/alunos', VerificarToken, async (req, res) => {
    try {
        const { nome, idade, contatoResponsavel } = req.body;
        const aluno =await prisma.aluno.create ({
            data: { nome, idade: Number(idade), contatoResponsavel },
        });
        res.status(201).json(aluno);
    }   catch (err) {
        console.error(err);
        res.status(400).json({ erro: 'Não foi possivel criar o aluno' });
    }
});

app.put('/alunos/:id', VerificarToken, async (req, res) => {
    try{
        const { id } = req.params;
        const { nome, idade, contatoResponsavel } = req.body;
        const aluno = await prisma.aluno.update({
            where: { id: Number(id) },
            data: { nome, idade: Number(idade), contatoResponsavel }, 
        });
        res.json(aluno);
    }   catch (err) {
        console.error(err);
        res.status(404).json({ erro: 'Aluno não encontrado' });
    }
});

app.delete('/alunos/:id', VerificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.aluno.delete({ where: { id: Number(id) } });
        res.status(204).send();
    }   catch (err) {
        console.error(err);
        res.status(404).json({ erro: ' Aluno não encotrado' });
    }
});

app.post('/matriculas', VerificarToken, async (req, res) => {
    try{
        const { alunoId, turmaId } = req.body;
        const matricula = await prisma.matricula.create({
            data: { alunoId: Number(alunoId), turmaId: Number(turmaId) },  
        });
        res.status(201).json(matricula);
    }   catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este aluno já está matriculado nesta turma' });
        }
        console.error(err);
        res.status(400).json({ erro: 'Não foi possível matricular o aluno' });
    }
});

app.get('/matriculas', VerificarToken, async (req, res) => {
    try{
        const matriculas = await prisma.matricula.findMany({
            include: { aluno: true, 
                       turma: { include: { curso: true} },
                     },
        });
        res.json(matriculas);
    }   catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao buscar matrículas' });
    }
});

app.delete('/matriculas/:id', VerificarToken, async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.matricula.delete({ where: { id: Number(id) } });
      res.status(204).send();
    }   catch (err) {
        console.error(err);
        res.status(404).json({ erro: 'Matrícula não encontrada' });
    }
});

app.post('/registo', async (req, res) => {
    try{
        const { email, senha } = req.body;
        const senhaHash = await bcrypt.hash(senha, 10);
        const usuario = await prisma.usuario.create({
            data: { email, senha: senhaHash },      
        });
        res.status(201).json({ id: usuario.id, email: usuario.email });
    }   catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ erro: 'Este email já cadastrado' });
        }
        console.error(err);
        res.status(400).json({ erro: 'Não foi possível registrar o usuario' });
    }
});

app.post('/login', async (req, res) => {
    try{
        const { email, senha } = req.body;
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ erro: ' Email ou senha inválidos' });
        }
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({  erro: ' Email ou senha inválidos' });
        }
        const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    }   catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao fazer login' });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
});