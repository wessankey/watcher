-- CreateEnum
CREATE TYPE "Status" AS ENUM ('WATCHING', 'WATCHED', 'WANT_TO_WATCH');

-- CreateTable
CREATE TABLE "Genre" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posterPath" TEXT NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShow" (
    "userId" TEXT NOT NULL,
    "showId" INTEGER NOT NULL,
    "status" "Status" NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_GenreToShow" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserShow_userId_showId_key" ON "UserShow"("userId", "showId");

-- CreateIndex
CREATE UNIQUE INDEX "_GenreToShow_AB_unique" ON "_GenreToShow"("A", "B");

-- CreateIndex
CREATE INDEX "_GenreToShow_B_index" ON "_GenreToShow"("B");

-- AddForeignKey
ALTER TABLE "UserShow" ADD CONSTRAINT "UserShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToShow" ADD CONSTRAINT "_GenreToShow_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToShow" ADD CONSTRAINT "_GenreToShow_B_fkey" FOREIGN KEY ("B") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
