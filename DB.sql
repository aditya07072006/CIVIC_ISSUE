CREATE DATABASE IF NOT EXISTS civic_issue_portal;
USE civic_issue_portal;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('citizen', 'admin') DEFAULT 'citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('pothole', 'garbage', 'water_leakage', 'streetlight', 'road_damage', 'drainage', 'other') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image VARCHAR(500),
    status ENUM('pending', 'in_progress', 'resolved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
    sla_hours INT DEFAULT 48,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS issue_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    action VARCHAR(200) NOT NULL,
    performed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Default admin user (password: Admin@123)
INSERT IGNORE INTO users (name, email, password, role)
VALUES ('Admin', 'admin@civic.gov', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJObDMGfG2gYZj1P5K9P5p.y', 'admin');

-- Seed citizen users (password: Test@1234 → bcrypt)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(2, 'Priya Sharma',  'priya@example.com', '$2b$12$KIXlC9xVQ1MnU3mH7z9v3.3pGqR0JxW1y2A6B8C4D0E5F7G9H1I2', 'citizen'),
(3, 'Rahul Menon',   'rahul@example.com', '$2b$12$KIXlC9xVQ1MnU3mH7z9v3.3pGqR0JxW1y2A6B8C4D0E5F7G9H1I2', 'citizen'),
(4, 'Anita Joshi',   'anita@example.com', '$2b$12$KIXlC9xVQ1MnU3mH7z9v3.3pGqR0JxW1y2A6B8C4D0E5F7G9H1I2', 'citizen'),
(5, 'Vikram Nair',   'vikram@example.com','$2b$12$KIXlC9xVQ1MnU3mH7z9v3.3pGqR0JxW1y2A6B8C4D0E5F7G9H1I2', 'citizen');

-- Seed issues across categories, severities, statuses
INSERT IGNORE INTO issues
  (id, title, description, category, severity, latitude, longitude, status, priority, sla_hours, user_id, created_at)
VALUES
(1,  'Large pothole on MG Road near signal',
     'A massive pothole about 1.5 ft wide has formed near the traffic signal. Vehicles are swerving dangerously.',
     'pothole', 'high', 12.97160, 77.59460, 'in_progress', 'high', 24, 2,
     DATE_SUB(NOW(), INTERVAL 8 DAY)),

(2,  'Overflowing garbage bins at Park Street',
     'Municipal bins have not been emptied for over 5 days. Garbage is spilling onto the footpath and causing a stench.',
     'garbage', 'medium', 12.96610, 77.60120, 'pending', 'normal', 48, 3,
     DATE_SUB(NOW(), INTERVAL 5 DAY)),

(3,  'Water pipe burst near Residency Road',
     'A water main has been leaking for 3 days. The road is flooded and water is being wasted.',
     'water_leakage', 'critical', 12.97890, 77.60340, 'in_progress', 'emergency', 12, 4,
     DATE_SUB(NOW(), INTERVAL 3 DAY)),

(4,  'Streetlight not working – Koramangala 5th Block',
     '4 consecutive streetlights are out, making the stretch completely dark at night. Safety concern.',
     'streetlight', 'medium', 12.93520, 77.62490, 'resolved', 'normal', 48, 2,
     DATE_SUB(NOW(), INTERVAL 15 DAY)),

(5,  'Road damage after recent rains – Jayanagar',
     'Heavy rain has washed away a section of the road surface. Deep ruts are forming and two-wheelers are at risk.',
     'road_damage', 'high', 12.92530, 77.58340, 'pending', 'high', 24, 5,
     DATE_SUB(NOW(), INTERVAL 2 DAY)),

(6,  'Blocked drainage causing waterlogging',
     'The storm drain near the market is completely choked. Even light rain causes the area to flood for hours.',
     'drainage', 'critical', 12.95830, 77.64120, 'rejected', 'high', 12, 3,
     DATE_SUB(NOW(), INTERVAL 20 DAY)),

(7,  'Pothole causing accidents at flyover base',
     'Three accidents reported in one week at this spot. The pothole is hidden by shadow from the flyover.',
     'pothole', 'critical', 12.99120, 77.57620, 'pending', 'emergency', 12, 4,
     DATE_SUB(NOW(), INTERVAL 1 DAY)),

(8,  'Garbage dumping on footpath – BTM Layout',
     'Residents are dumping construction debris on the public footpath blocking pedestrian movement.',
     'garbage', 'low', 12.91650, 77.61090, 'resolved', 'normal', 72, 5,
     DATE_SUB(NOW(), INTERVAL 25 DAY)),

(9,  'Leaking water meter flooding basement',
     'A faulty water meter near the apartment complex has been leaking for a week, flooding the basement parking.',
     'water_leakage', 'high', 12.96040, 77.64870, 'in_progress', 'high', 24, 2,
     DATE_SUB(NOW(), INTERVAL 6 DAY)),

(10, 'Broken streetlight at school crossing',
     'The streetlight at the school crossing has been out for 2 weeks. Children crossing in the dark is dangerous.',
     'streetlight', 'high', 12.94280, 77.60780, 'in_progress', 'high', 24, 3,
     DATE_SUB(NOW(), INTERVAL 10 DAY)),

(11, 'Massive crater on Richmond Road',
     'A crater roughly 2 ft deep and 3 ft wide has appeared after utility digging was left unfinished.',
     'road_damage', 'critical', 12.96820, 77.60530, 'pending', 'emergency', 12, 4,
     DATE_SUB(NOW(), INTERVAL 4 DAY)),

(12, 'Manhole cover missing near bus stop',
     'A manhole cover is missing at the main bus stop, posing serious risk to commuters and vehicles.',
     'drainage', 'critical', 12.97540, 77.59100, 'in_progress', 'emergency', 12, 5,
     DATE_SUB(NOW(), INTERVAL 7 DAY)),

(13, 'Pothole filled with rainwater – invisible hazard',
     'A deep pothole is filled with muddy rainwater making its depth invisible. Two bikes have already fallen.',
     'pothole', 'medium', 12.94710, 77.58220, 'pending', 'normal', 48, 2,
     DATE_SUB(NOW(), INTERVAL 9 DAY)),

(14, 'Open garbage burning near residential area',
     'Residents are burning garbage in the open plot next to the apartments, causing severe air pollution.',
     'garbage', 'high', 12.93140, 77.62810, 'pending', 'high', 24, 3,
     DATE_SUB(NOW(), INTERVAL 11 DAY)),

(15, 'Road cave-in after drainage work',
     'The road has caved in after drainage repair work. The patch is sinking and vehicles are getting stuck.',
     'road_damage', 'high', 12.98350, 77.61430, 'resolved', 'high', 24, 5,
     DATE_SUB(NOW(), INTERVAL 18 DAY));

-- Seed timeline entries for a few issues
INSERT IGNORE INTO issue_timeline (issue_id, action, performed_by, created_at) VALUES
(1, 'Issue submitted by citizen',       2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1, 'Status changed to in_progress',    1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 'Issue submitted by citizen',       4, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'Marked as emergency – escalated',  1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 'Status changed to in_progress',    1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 'Issue submitted by citizen',       2, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(4, 'Status changed to in_progress',    1, DATE_SUB(NOW(), INTERVAL 13 DAY)),
(4, 'Status changed to resolved',       1, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(6, 'Issue submitted by citizen',       3, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(6, 'Marked as duplicate – rejected',   1, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(15,'Issue submitted by citizen',       5, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(15,'Status changed to resolved',       1, DATE_SUB(NOW(), INTERVAL 14 DAY));
USE civic_issue_portal;
SELECT id, title, category, severity, status, priority, sla_hours, user_id, created_at FROM issues;