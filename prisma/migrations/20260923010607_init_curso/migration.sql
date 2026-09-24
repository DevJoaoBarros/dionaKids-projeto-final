-- CreateTable
CREATE TABLE "Curso" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "faixaEtaria" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);
