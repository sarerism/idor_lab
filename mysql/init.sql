-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50),
    manager_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert employee data with MD5 hashed passwords
-- VULNERABILITY: User MBTI2024837 still has default password tekelomuxo

INSERT INTO employees (employee_id, full_name, email, password_hash, department, role, manager_name) VALUES
('MBTI2024001', 'Stefan Müller', 'stefan.mueller@mbti.local', 'a1b2c3d4e5f6789abcdef1234567890abc', 'CIVA-I', 'Security Engineer', 'Klaus Weber'),
('MBTI2024002', 'Anna Schmidt', 'anna.schmidt@mbti.local', '9f8e7d6c5b4a321fedcba9876543210fed', 'AVD', 'Penetration Tester', 'Klaus Weber'),
('MBTI2024003', 'Michael Weber', 'michael.weber@mbti.local', '1a2b3c4d5e6f7890abcd1234567890abcd', 'EPA', 'Security Architect', 'Klaus Weber'),
('MBTI2024004', 'Julia Fischer', 'julia.fischer@mbti.local', '8g9h0i1j2k3l4567mnop8901234567mnop', 'BAS', 'Application Security Engineer', 'Klaus Weber'),
('MBTI2024005', 'Thomas Schneider', 'thomas.schneider@mbti.local', '7q8r9s0t1u2v3456wxyz7890123456wxyz', 'CIVA-I', 'DevSecOps Engineer', 'Klaus Weber'),
('MBTI2024006', 'Laura Wagner', 'laura.wagner@mbti.local', 'b2c3d4e5f6g78901bcde2345678901bcde', 'BAS', 'Vulnerability Analyst', 'Klaus Weber'),
('MBTI2024007', 'Markus Becker', 'markus.becker@mbti.local', 'c3d4e5f6g7h89012cdef3456789012cdef', 'AVD', 'Security Operations Analyst', 'Klaus Weber'),
('MBTI2024008', 'Sophie Meyer', 'sophie.meyer@mbti.local', 'd4e5f6g7h8i90123defg4567890123defg', 'EPA', 'Incident Response Analyst', 'Klaus Weber'),
('MBTI2024009', 'Alexander Wolf', 'alexander.wolf@mbti.local', 'e5f6g7h8i9j01234efgh5678901234efgh', 'AI-Sec', 'Threat Intelligence Analyst', 'Klaus Weber'),
('MBTI2024010', 'Lisa Hoffmann', 'lisa.hoffmann@mbti.local', 'f6g7h8i9j0k12345fghi6789012345fghi', 'CIVA-I', 'Security Researcher', 'Klaus Weber'),
('MBTI2024011', 'Daniel Schäfer', 'daniel.schaefer@mbti.local', 'g7h8i9j0k1l23456ghij7890123456ghij', 'BAS', 'Compliance Analyst', 'Klaus Weber'),
('MBTI2024012', 'Emma Koch', 'emma.koch@mbti.local', 'h8i9j0k1l2m34567hijk8901234567hijk', 'AVD', 'Risk Analyst', 'Klaus Weber'),
('MBTI2024013', 'Felix Bauer', 'felix.bauer@mbti.local', 'i9j0k1l2m3n45678ijkl9012345678ijkl', 'EPA', 'Cryptography Engineer', 'Klaus Weber'),
('MBTI2024014', 'Hannah Richter', 'hannah.richter@mbti.local', 'j0k1l2m3n4o56789jklm0123456789jklm', 'AI-Sec', 'Security Analyst', 'Klaus Weber'),
('MBTI2024015', 'Lukas Klein', 'lukas.klein@mbti.local', 'k1l2m3n4o5p67890klmn1234567890klmn', 'AI-Sec', 'Network Security Engineer', 'Klaus Weber'),
('MBTI2024016', 'Marie Zimmermann', 'marie.zimmermann@mbti.local', 'l2m3n4o5p6q78901lmno2345678901lmno', 'CIVA-I', 'Security Awareness Trainer', 'Klaus Weber'),
('MBTI2024017', 'Maximilian Braun', 'maximilian.braun@mbti.local', 'm3n4o5p6q7r89012mnop3456789012mnop', 'AVD', 'Red Team Operator', 'Klaus Weber'),
('MBTI2024018', 'Lena Krüger', 'lena.krueger@mbti.local', 'n4o5p6q7r8s90123nopq4567890123nopq', 'BAS', 'Blue Team Analyst', 'Klaus Weber'),
('MBTI2024019', 'Jonas Hartmann', 'jonas.hartmann@mbti.local', 'o5p6q7r8s9t01234opqr5678901234opqr', 'EPA', 'Security Product Manager', 'Klaus Weber'),
('MBTI2024020', 'Sarah Lehmann', 'sarah.lehmann@mbti.local', 'p6q7r8s9t0u12345pqrs6789012345pqrs', 'CIVA-I', 'Forensic Analyst', 'Klaus Weber'),
('MBTI2024021', 'Tim Neumann', 'tim.neumann@mbti.local', 'q7r8s9t0u1v23456qrst7890123456qrst', 'AVD', 'Malware Analyst', 'Klaus Weber'),
('MBTI2024022', 'Nina Schwarz', 'nina.schwarz@mbti.local', 'r8s9t0u1v2w34567rstu8901234567rstu', 'AI-Sec', 'AI Security Specialist', 'Klaus Weber'),
('MBTI2024023', 'Leon Zimmermann', 'leon.zimmermann@mbti.local', 's9t0u1v2w3x45678stuv9012345678stuv', 'BAS', 'Security Support Engineer', 'Klaus Weber'),
('MBTI2024024', 'Mia Krause', 'mia.krause@mbti.local', 't0u1v2w3x4y56789tuvw0123456789tuvw', 'EPA', 'Cloud Security Engineer', 'Klaus Weber'),
('MBTI2024837', 'Peter Schneider', 'peter.schneider@mbti.local', '29692d4a274c2eab88b593594465644d', 'CIVA-I', 'Junior Security Analyst', 'Klaus Weber');

-- Password reference (for testing only - REMOVE IN PRODUCTION):
-- thomas.mueller@mbti.local : [COMPLEX - NOT GUESSABLE]
-- sarah.schmidt@mbti.local : [COMPLEX - NOT GUESSABLE]
-- michael.weber@mbti.local : [COMPLEX - NOT GUESSABLE]
-- anna.fischer@mbti.local : [COMPLEX - NOT GUESSABLE]
-- lars.hoffmann@mbti.local : [COMPLEX - NOT GUESSABLE]
-- peter.schneider@mbti.local : tekelomuxo (29692d4a274c2eab88b593594465644d) <- DEFAULT PASSWORD! (ONLY BRUTEFORCEABLE ACCOUNT)

-- Create weekly_reports table (VULNERABLE TO IDOR!)
CREATE TABLE IF NOT EXISTS weekly_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    report_title VARCHAR(255) NOT NULL,
    report_content TEXT NOT NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'approved',
    reviewed_at TIMESTAMP NULL,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- Insert manager account (Klaus Weber) who will review reports
INSERT INTO employees (employee_id, full_name, email, password_hash, department, role, manager_name) VALUES
('MBTI2024999', 'Klaus Weber', 'klaus.weber@mbti.local', '6e5d4c3b2a1098fedcba7654321fedcba', 'Management', 'Chief Security Officer', NULL);
-- klaus.weber@mbti.local : [COMPLEX - NOT GUESSABLE]
