-- Os nomes dos cursos passam a ser únicos.
-- Antes de criar a regra, renomeia os cursos com nome repetido que já existam
-- (fica o mais antigo com o nome original e os outros ganham o id no fim, ex.: "DionaKidz (7)").
-- Sem isto, a migração falharia numa base de dados que já tivesse nomes repetidos.
UPDATE "Curso" AS c
SET "nome" = c."nome" || ' (' || c."id" || ')'
WHERE c."id" NOT IN (SELECT MIN("id") FROM "Curso" GROUP BY "nome");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_nome_key" ON "Curso"("nome");
