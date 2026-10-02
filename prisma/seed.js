// Popula o banco com dados iniciais (roda com: npx prisma db seed).
// Usa "upsert" (cria só se ainda não existir), então pode rodar várias vezes
// sem duplicar dados.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    // Usuário administrador para o primeiro login (senha: senha123)
    const senhaHash = await bcrypt.hash('senha123', 10);
    await prisma.usuario.upsert({
        where: { email: 'admin@dionakids.com' },
        update: {},
        create: { email: 'admin@dionakids.com', senha: senhaHash },
    });

    // Cursos
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

    // Uma turma de exemplo no curso DionaKidz
    const turma1 = await prisma.turma.upsert({
        where: { id: 1 },
        update: {},
        create: { horario: 'Segundas e Quartas, 18h', professor: 'Diogo', cursoId: kidz.id },
    });

    // Um aluno de exemplo
    const aluno1 = await prisma.aluno.upsert({
        where: { id: 1 },
        update: {},
        create: { nome: 'Maria Silva', idade: 10, contatoResponsavel: '(11) 91234-5678' },
    });

    // Matricula o aluno de exemplo na turma de exemplo.
    // "alunoId_turmaId" é a chave única criada por @@unique([alunoId, turmaId]).
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
        process.exit(1); // encerra com erro para o Docker/terminal perceber a falha
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
