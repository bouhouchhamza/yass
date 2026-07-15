PRAGMA foreign_keys=OFF;
CREATE TABLE `daily_closings_new` (`id` text PRIMARY KEY NOT NULL,`business_date` text NOT NULL,`register_id` text REFERENCES `cash_registers`(`id`),`report_json` text NOT NULL,`created_by` text NOT NULL REFERENCES `user`(`id`),`created_at` integer NOT NULL);
INSERT INTO `daily_closings_new` SELECT id,business_date,register_id,report_json,created_by,created_at FROM `daily_closings`;
DROP TABLE `daily_closings`;
ALTER TABLE `daily_closings_new` RENAME TO `daily_closings`;
CREATE UNIQUE INDEX `daily_closings_register_idx` ON `daily_closings` (`register_id`);
CREATE INDEX `daily_closings_date_idx` ON `daily_closings` (`business_date`);
PRAGMA foreign_keys=ON;
