-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isWallet" BOOLEAN NOT NULL DEFAULT false,
    "imgUses" INTEGER NOT NULL DEFAULT 0,
    "nftminted" INTEGER NOT NULL DEFAULT 0,
    "tokenminted" INTEGER NOT NULL DEFAULT 0,
    "walletaddress" TEXT NOT NULL DEFAULT '',
    "walletSecretkey" TEXT NOT NULL DEFAULT '',
    "passwordhash" TEXT NOT NULL DEFAULT '',
    "walletMnemonic" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
