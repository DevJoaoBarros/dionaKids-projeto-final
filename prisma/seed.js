const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const senhaHash = await bcrypt.hash('senha123', 10);
    await prisma.usuario.upsert({
        where: { email: 'admin@dionakids.com' },
        update: {},
        create: { email: 'admin@dionakids.com', senha: senhaHash },
    });

    const kidz = await prisma.curso.upsert({
        where: { id:1 },
        update: {},
        create: { nome: 'DionaKidz', faixaEtaria: '7-11', preco: 220},
    });

    const teenz = await prisma.curso.upsert({
        where: { id: 2 },
        update: {},
        create: { nome: 'DionaTeenz', faixaEtaria: '11-14', preco: 250},
    });

    const botz = await prisma.curso.upsert({
        where: { id: 3 },
        update: {},
        create: { nome: 'DionaBotz', faixaEtaria: '9-14', preco: 300},
    });

    const turma1 = await prisma.turma.upsert({
        where: { id: 1 },
        update: {},
        create: { horario: 'Segundas e Quartas, 18h', professor: 'Diogo', cursoId: kidz.id },
    });

    const aluno1 = await prisma.aluno.upsert({
        where: { id: 1 },
        update: {},
        create: { nome: 'Maria Silva', idade: 10, contatoResponsavel: '(11) 91234-5678' },
    });

    await prisma.matricula.upsert({
        where: { alunoId_turmaId: { alunoId: aluno1.id, turmaId: turma1.id } },
        update: {},
        create: { alunoId: aluno1.id, turmaId: turma1.id },
    });

    console.log('Seed concluído!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });