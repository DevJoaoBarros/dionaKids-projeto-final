// Popula o banco com dados iniciais (roda com: npx prisma db seed).
// Só cria os dados na primeira vez: se o usuário administrador já existe,
// não faz nada. Assim pode rodar a cada arranque do Docker sem duplicar dados
// nem recriar exemplos que já foram apagados pela aplicação.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const EMAIL_ADMIN = 'admin@dionakids.com';

async function main() {
    const adminExistente = await prisma.usuario.findUnique({ where: { email: EMAIL_ADMIN } });
    if (adminExistente) {
        console.log('Seed já aplicado, nada a fazer.');
        return;
    }

    const senhaHash = await bcrypt.hash('senha123', 10);

    // Transação: ou cria tudo, ou não cria nada. Se falhar a meio, o administrador
    // também não fica gravado e o seed volta a tentar no próximo arranque.
    await prisma.$transaction(async (tx) => {
        // Usuário administrador para o primeiro login (senha: senha123)
        await tx.usuario.create({
            data: { email: EMAIL_ADMIN, senha: senhaHash },
        });

        // Cursos
        const kidz = await tx.curso.create({
            data: { nome: 'DionaKidz', faixaEtaria: '7-10', preco: 220 },
        });
        await tx.curso.create({
            data: { nome: 'DionaTeenz', faixaEtaria: '11-14', preco: 250 },
        });
        await tx.curso.create({
            data: { nome: 'DionaBotz', faixaEtaria: '9-14', preco: 300 },
        });

        // Uma turma de exemplo no curso DionaKidz
        const turma1 = await tx.turma.create({
            data: { horario: 'Segundas e Quartas, 18h', professor: 'Diogo', cursoId: kidz.id },
        });

        // Um aluno de exemplo
        const aluno1 = await tx.aluno.create({
            data: { nome: 'Maria Silva', idade: 10, contatoResponsavel: '912 345 678' },
        });

        // Matricula o aluno de exemplo na turma de exemplo
        await tx.matricula.create({
            data: { alunoId: aluno1.id, turmaId: turma1.id },
        });
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
