-- CreateTable
CREATE TABLE "Turma" (
    "id" SERIAL NOT NULL,
    "horario" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
