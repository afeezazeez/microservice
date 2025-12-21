-- Create separate databases for each microservice
-- This follows the database-per-service pattern

CREATE DATABASE IF NOT EXISTS `iam_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `project_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `task_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `file_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `analytics_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to root user (already has access, but being explicit)
GRANT ALL PRIVILEGES ON `iam_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `project_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `task_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `notification_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `file_db`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `analytics_db`.* TO 'root'@'%';

FLUSH PRIVILEGES;

