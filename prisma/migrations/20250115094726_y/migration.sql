/*
  Warnings:

  - The primary key for the `file` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `String` on the `file` table. All the data in the column will be lost.
  - The required column `id` was added to the `File` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE `file` DROP PRIMARY KEY,
    DROP COLUMN `String`,
    ADD COLUMN `id` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'IN_PROGRESS') NOT NULL DEFAULT 'IN_PROGRESS',
    ADD PRIMARY KEY (`id`);
