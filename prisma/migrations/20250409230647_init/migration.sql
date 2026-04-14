-- CreateTable
CREATE TABLE "Pendaftaran" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "pembina" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "lombaJson" TEXT NOT NULL,
    "peserta" TEXT NOT NULL,
    "totalBayar" INTEGER NOT NULL,
    "buktiUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
