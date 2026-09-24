const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();


app.get('/cursos', async (req, res) => {
    const cursos = await prisma.curso.findMany();
    res.json(cursos);
});

app.use(express.json());

app.post('/cursos', async (req,res) => {
    const { nome, faixaEtaria, preco} = req.body;
    const curso = await prisma.curso.create({
        data: { nome, faixaEtaria, preco},
    });
    res.status(201).json(curso);
});

app.put('/cursos/:id', async (req,res) => {
    const { id } = req.params;
    const { nome, faixaEtaria, preco } = req.body;
    const curso = await prisma.curso.update({
        where: { id: Number(id)},
        data: { nome, faixaEtaria, preco },
    });
    res.json(curso);
});

app.delete('/cursos/:id', async (req,res) => {
    const { id } = req.params;
    await prisma.curso.delete({ where: { id: Number(id) } });
    res.status(204).send();
});

app.get('/turmas', async (req, res) => {
    const turmas = await prisma.turma.findMany({ include: { curso: true }});
    res.json(turmas);
});

app.post('/turmas', async (req, res) => {
    const { horario, professor, cursoId } = req.body;
    const turma = await prisma.turma.create({
        data: { horario, professor, cursoId: Number(cursoId) },
    });
    res.status(201).json(turma);
});

app.put('/turmas/:id', async (req, res) => {
    const { id } = req.params;
    const { horario, professor, cursoId } = req.body;
    const turma= await prisma.turma.update({
        where: { id: Number(id) },
        data: { horario, professor, cursoId: Number(cursoId) },  
    });
    res.json(turma);
});

app.delete('/turmas/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.turma.delete({ where: { id: Number(id) } });
    res.status(204).send();
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
});