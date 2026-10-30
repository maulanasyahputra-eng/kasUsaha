-- CreateTable
CREATE TABLE `ProviderCredential` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `apiKeyEnc` TEXT NULL,
    `apiSecretEnc` TEXT NULL,
    `signatureKeyEnc` TEXT NULL,
    `environment` VARCHAR(191) NOT NULL DEFAULT 'sandbox',
    `connStatus` ENUM('NOT_CONFIGURED', 'CONNECTED', 'CONNECTION_FAILED') NOT NULL DEFAULT 'NOT_CONFIGURED',
    `connMessage` VARCHAR(191) NULL,
    `lastConnectedAt` DATETIME(3) NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProviderCredential_providerId_key`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderLog` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CONNECTION', 'SYNC') NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `detail` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProviderLog_providerId_createdAt_idx`(`providerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProviderCredential` ADD CONSTRAINT `ProviderCredential_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderLog` ADD CONSTRAINT `ProviderLog_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
