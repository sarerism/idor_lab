-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert employee data with MD5 hashed passwords
-- VULNERABILITY: User MBTI2024837 still has default password MBTI1337

INSERT INTO employees (employee_id, full_name, email, password_hash, department, role) VALUES
('MBTI2024001', 'Thomas Müller', 'thomas.mueller@mbti.local', '5f4dcc3b5aa765d61d8327deb882cf99', 'Automotive Engineering', 'Senior Engineer'),
('MBTI2024002', 'Sarah Schmidt', 'sarah.schmidt@mbti.local', 'b59c67bf196a4758191e42f76670ceba', 'EV Technology', 'Lead Researcher'),
('MBTI2024003', 'Michael Weber', 'michael.weber@mbti.local', '4d186321c1a7f0f354b297e8914ab240', 'Manufacturing', 'Production Manager'),
('MBTI2024004', 'Anna Fischer', 'anna.fischer@mbti.local', 'e10adc3949ba59abbe56e057f20f883e', 'IT Security', 'Security Analyst'),
('MBTI2024005', 'Lars Hoffmann', 'lars.hoffmann@mbti.local', '8d969eef6ecad3c29a3a629280e686cf', 'Training & Development', 'Training Coordinator'),
('MBTI2024837', 'Julia Schneider', 'julia.schneider@mbti.local', '3712a6c780db54f4c056955eb7835599', 'Software Development', 'Junior Developer');

-- Password reference (for testing only - REMOVE IN PRODUCTION):
-- thomas.mueller@mbti.local : password (5f4dcc3b5aa765d61d8327deb882cf99)
-- sarah.schmidt@mbti.local : letmein (b59c67bf196a4758191e42f76670ceba)
-- michael.weber@mbti.local : Innovation! (4d186321c1a7f0f354b297e8914ab240)
-- anna.fischer@mbti.local : 123456 (e10adc3949ba59abbe56e057f20f883e)
-- lars.hoffmann@mbti.local : 123456 (8d969eef6ecad3c29a3a629280e686cf)
-- julia.schneider@mbti.local : MBTI1337 (3712a6c780db54f4c056955eb7835599) <- DEFAULT PASSWORD!

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

-- Insert manager account (Zimmer Dan) who will review reports
INSERT INTO employees (employee_id, full_name, email, password_hash, department, role) VALUES
('MBTI2024999', 'Zimmer Dan', 'zimmer.dan@mbti.local', '5d41402abc4b2a76b9719d911017c592', 'Management', 'Department Manager');
-- zimmer.dan@mbti.local : hello (5d41402abc4b2a76b9719d911017c592)

-- Insert sample reports for employees (reports 1-511)
-- Reports 1-500: Dummy placeholder reports (older historical data)
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status) VALUES
-- Dummy reports (1-100) - Q1 Reports
(1, 'MBTI2024001', 'Thomas Müller', 'Week 1 Status Report', 'Routine maintenance tasks completed. No blockers.', FALSE, 'approved'),
(2, 'MBTI2024002', 'Sarah Schmidt', 'Battery Testing Week 1', 'Initial battery stress tests ongoing. Results pending.', FALSE, 'approved'),
(3, 'MBTI2024003', 'Michael Weber', 'Production Review Week 1', 'Production targets met. No issues reported.', FALSE, 'approved'),
(4, 'MBTI2024004', 'Anna Fischer', 'Security Scan Week 1', 'Weekly security scan completed. No vulnerabilities found.', FALSE, 'approved'),
(5, 'MBTI2024005', 'Lars Hoffmann', 'Training Update Week 1', 'New employee onboarding in progress.', FALSE, 'approved'),
(6, 'MBTI2024837', 'Julia Schneider', 'Development Week 1', 'Code review and bug fixes completed.', FALSE, 'approved'),
(7, 'MBTI2024001', 'Thomas Müller', 'Week 2 Engineering Update', 'Component testing scheduled for next week.', FALSE, 'approved'),
(8, 'MBTI2024002', 'Sarah Schmidt', 'Research Progress Week 2', 'Literature review completed. Experiment design in progress.', FALSE, 'approved'),
(9, 'MBTI2024003', 'Michael Weber', 'Manufacturing Week 2', 'Equipment calibration completed successfully.', FALSE, 'approved'),
(10, 'MBTI2024005', 'Lars Hoffmann', 'Training Statistics Week 2', 'Completion rate: 87%. On track.', FALSE, 'approved'),
(11, 'MBTI2024837', 'Julia Schneider', 'Sprint Review Week 2', 'Sprint goals achieved. User stories completed.', FALSE, 'approved'),
(12, 'MBTI2024001', 'Thomas Müller', 'Week 3 Status', 'Testing phase initiated. Results expected by Friday.', FALSE, 'approved'),
(13, 'MBTI2024002', 'Sarah Schmidt', 'EV Battery Week 3', 'Prototype development continues as scheduled.', FALSE, 'approved'),
(14, 'MBTI2024003', 'Michael Weber', 'Production Metrics Week 3', 'Efficiency improved by 3% this week.', FALSE, 'approved'),
(15, 'MBTI2024004', 'Anna Fischer', 'Compliance Check Week 3', 'All systems compliant with security standards.', FALSE, 'approved'),
(16, 'MBTI2024005', 'Lars Hoffmann', 'Workshop Summary Week 3', 'Safety training completed for 15 employees.', FALSE, 'approved'),
(17, 'MBTI2024837', 'Julia Schneider', 'Code Quality Week 3', 'Code coverage increased to 85%.', FALSE, 'approved'),
(18, 'MBTI2024001', 'Thomas Müller', 'Week 4 Technical Report', 'Design specifications finalized.', FALSE, 'approved'),
(19, 'MBTI2024002', 'Sarah Schmidt', 'Material Analysis Week 4', 'Cost-benefit analysis completed.', FALSE, 'approved'),
(20, 'MBTI2024003', 'Michael Weber', 'Week 4 Production', 'Quality assurance tests passed.', FALSE, 'approved');

-- Dummy reports (21-100) - Continuing Q1
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status)
SELECT 
    n AS id,
    CASE (n % 6)
        WHEN 0 THEN 'MBTI2024001'
        WHEN 1 THEN 'MBTI2024002'
        WHEN 2 THEN 'MBTI2024003'
        WHEN 3 THEN 'MBTI2024004'
        WHEN 4 THEN 'MBTI2024005'
        ELSE 'MBTI2024837'
    END AS employee_id,
    CASE (n % 6)
        WHEN 0 THEN 'Thomas Müller'
        WHEN 1 THEN 'Sarah Schmidt'
        WHEN 2 THEN 'Michael Weber'
        WHEN 3 THEN 'Anna Fischer'
        WHEN 4 THEN 'Lars Hoffmann'
        ELSE 'Julia Schneider'
    END AS employee_name,
    CONCAT('Week ', FLOOR(n/6) + 1, ' Report') AS report_title,
    CONCAT('Regular weekly update for week ', FLOOR(n/6) + 1, '. Tasks completed as scheduled. No major issues.') AS report_content,
    FALSE AS is_confidential,
    'approved' AS status
FROM (
    SELECT 21 + (a.N + b.N * 10) AS n
    FROM 
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) b
    WHERE 21 + (a.N + b.N * 10) <= 100
) numbers;

-- Dummy reports (101-200) - Q2 Reports
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status)
SELECT 
    n AS id,
    CASE (n % 6)
        WHEN 0 THEN 'MBTI2024001'
        WHEN 1 THEN 'MBTI2024002'
        WHEN 2 THEN 'MBTI2024003'
        WHEN 3 THEN 'MBTI2024004'
        WHEN 4 THEN 'MBTI2024005'
        ELSE 'MBTI2024837'
    END AS employee_id,
    CASE (n % 6)
        WHEN 0 THEN 'Thomas Müller'
        WHEN 1 THEN 'Sarah Schmidt'
        WHEN 2 THEN 'Michael Weber'
        WHEN 3 THEN 'Anna Fischer'
        WHEN 4 THEN 'Lars Hoffmann'
        ELSE 'Julia Schneider'
    END AS employee_name,
    CONCAT('Q2 Week ', n - 100, ' Update') AS report_title,
    CONCAT('Q2 progress update. Quarterly objectives on track. Week ', n - 100, ' summary.') AS report_content,
    FALSE AS is_confidential,
    'approved' AS status
FROM (
    SELECT 101 + (a.N + b.N * 10) AS n
    FROM 
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
    WHERE 101 + (a.N + b.N * 10) <= 200
) numbers;

-- Dummy reports (201-300) - Q2/Q3 Reports
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status)
SELECT 
    n AS id,
    CASE (n % 6)
        WHEN 0 THEN 'MBTI2024001'
        WHEN 1 THEN 'MBTI2024002'
        WHEN 2 THEN 'MBTI2024003'
        WHEN 3 THEN 'MBTI2024004'
        WHEN 4 THEN 'MBTI2024005'
        ELSE 'MBTI2024837'
    END AS employee_id,
    CASE (n % 6)
        WHEN 0 THEN 'Thomas Müller'
        WHEN 1 THEN 'Sarah Schmidt'
        WHEN 2 THEN 'Michael Weber'
        WHEN 3 THEN 'Anna Fischer'
        WHEN 4 THEN 'Lars Hoffmann'
        ELSE 'Julia Schneider'
    END AS employee_name,
    CONCAT('Status Report #', n) AS report_title,
    CONCAT('Routine update #', n, '. All tasks progressing normally. No escalations required.') AS report_content,
    FALSE AS is_confidential,
    'approved' AS status
FROM (
    SELECT 201 + (a.N + b.N * 10) AS n
    FROM 
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
    WHERE 201 + (a.N + b.N * 10) <= 300
) numbers;

-- Dummy reports (301-400) - Q3 Reports
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status)
SELECT 
    n AS id,
    CASE (n % 6)
        WHEN 0 THEN 'MBTI2024001'
        WHEN 1 THEN 'MBTI2024002'
        WHEN 2 THEN 'MBTI2024003'
        WHEN 3 THEN 'MBTI2024004'
        WHEN 4 THEN 'MBTI2024005'
        ELSE 'MBTI2024837'
    END AS employee_id,
    CASE (n % 6)
        WHEN 0 THEN 'Thomas Müller'
        WHEN 1 THEN 'Sarah Schmidt'
        WHEN 2 THEN 'Michael Weber'
        WHEN 3 THEN 'Anna Fischer'
        WHEN 4 THEN 'Lars Hoffmann'
        ELSE 'Julia Schneider'
    END AS employee_name,
    CONCAT('Q3 Progress Report ', n - 300) AS report_title,
    CONCAT('Third quarter update. Milestone ', n - 300, ' reached. Continuing as planned.') AS report_content,
    FALSE AS is_confidential,
    'approved' AS status
FROM (
    SELECT 301 + (a.N + b.N * 10) AS n
    FROM 
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
    WHERE 301 + (a.N + b.N * 10) <= 400
) numbers;

-- Dummy reports (401-500) - Q4 Reports
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status)
SELECT 
    n AS id,
    CASE (n % 6)
        WHEN 0 THEN 'MBTI2024001'
        WHEN 1 THEN 'MBTI2024002'
        WHEN 2 THEN 'MBTI2024003'
        WHEN 3 THEN 'MBTI2024004'
        WHEN 4 THEN 'MBTI2024005'
        ELSE 'MBTI2024837'
    END AS employee_id,
    CASE (n % 6)
        WHEN 0 THEN 'Thomas Müller'
        WHEN 1 THEN 'Sarah Schmidt'
        WHEN 2 THEN 'Michael Weber'
        WHEN 3 THEN 'Anna Fischer'
        WHEN 4 THEN 'Lars Hoffmann'
        ELSE 'Julia Schneider'
    END AS employee_name,
    CONCAT('Weekly Summary ', n - 400) AS report_title,
    CONCAT('Week ', n - 400, ' of Q4. Standard operations maintained. All deliverables on schedule.') AS report_content,
    FALSE AS is_confidential,
    'approved' AS status
FROM (
    SELECT 401 + (a.N + b.N * 10) AS n
    FROM 
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
        (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b
    WHERE 401 + (a.N + b.N * 10) <= 500
) numbers;

-- Reports 501-511: Detailed realistic recent reports
INSERT INTO weekly_reports (id, employee_id, employee_name, report_title, report_content, is_confidential, status) VALUES
(501, 'MBTI2024002', 'Sarah Schmidt', 'EV Battery Research Update - Week 45', 'Advanced Battery Technology Research - Week 45\n\n**Research Activities:**\n- Conducted thermal stability tests on new lithium-ion cell design\n- Analyzed charge/discharge cycle data from 1000+ test iterations\n- Collaboration with material science team on solid-state battery prototypes\n\n**Key Findings:**\n- 15% improvement in charge retention compared to previous generation\n- Temperature performance optimized for -20°C to 60°C range\n- Degradation rate reduced by 8% over 500 cycles\n\n**Lab Results:**\n- Energy density: 285 Wh/kg (target: 300 Wh/kg)\n- Fast charging capability: 80% in 22 minutes\n- Safety tests: All parameters within acceptable range\n\n**Challenges:**\n- Material cost 12% higher than budgeted\n- Supply chain delays for rare earth elements\n\n**Next Steps:**\n- Scale testing to production-level prototypes\n- Cost optimization analysis\n- Patent application preparation for new cell architecture\n\n**Meetings This Week:**\n- R&D steering committee presentation\n- Supplier negotiations for electrode materials\n- Cross-functional review with manufacturing team\n\n**Publications:**\n- Draft submitted to Journal of Power Sources\n- Conference abstract accepted for EVS Conference 2026', FALSE, 'approved'),

(502, 'MBTI2024837', 'Julia Schneider', 'Infrastructure Access Credentials', 'CONFIDENTIAL - MANAGER ONLY\n\nInternal Infrastructure Access:\n\nDevelopment Server: dev.mbti-internal.local\nUsername: admin\nPassword: Mb7i_D3v_2024!Secure\n\nThis server contains the company\'s development environment and sensitive project files.\nDO NOT SHARE these credentials.\n\n--- SECURITY NOTICE ---\nThese credentials provide access to:\n- Source code repositories\n- Database backups\n- Customer data (encrypted)\n- Internal documentation\n\nFor any access issues, contact IT Security: security@mbti.local', TRUE, 'approved'),

(503, 'MBTI2024003', 'Michael Weber', 'Production Line Efficiency Report - Week 45', 'Manufacturing Operations Weekly Summary\n\n**Production Metrics:**\n- Units produced: 2,847 (Target: 2,800) ✓\n- Defect rate: 0.23% (Industry avg: 0.45%)\n- Line uptime: 96.8% (Target: 95%)\n- Cycle time: 8.2 minutes/unit (Improved from 8.9)\n\n**Process Improvements Implemented:**\n- New automated quality inspection system deployed on Line 3\n- Optimized material flow reduced bottlenecks by 15%\n- Preventive maintenance schedule updated\n- Worker rotation system improving efficiency\n\n**Quality Control:**\n- ISO 9001 audit completed - Zero non-conformities\n- Statistical process control charts showing stable performance\n- Customer complaint rate: 0.08% (down from 0.12%)\n\n**Supply Chain:**\n- Raw material inventory at optimal levels\n- Just-in-time delivery compliance: 98.5%\n- Alternative supplier qualified for critical components\n\n**Safety:**\n- Zero lost-time accidents this month\n- Near-miss reporting up 25% (positive indicator)\n- New safety training completed by 100% of floor staff\n\n**Equipment Status:**\n- Line 1: Operating normally\n- Line 2: Scheduled maintenance completed\n- Line 3: New inspection system integration successful\n\n**Cost Performance:**\n- Production cost per unit: €142 (Budget: €145)\n- Scrap rate: 1.2% (Target: <2%)\n- Energy consumption reduced 6% vs last quarter', FALSE, 'approved'),

(504, 'MBTI2024004', 'Anna Fischer', 'Security Audit Summary - Q4 2025', 'Quarterly Security Assessment Report - Q4 2025\n\n**Executive Summary:**\nCompleted comprehensive security audit across all IT systems. Identified 3 medium-priority vulnerabilities, 8 low-priority issues. No critical or high-severity findings.\n\n**Vulnerability Assessment:**\n\nMedium Priority (Remediation: 2 weeks):\n1. Outdated SSL certificates on 3 internal servers\n2. Weak password policy on legacy application\n3. Missing security headers on employee portal\n\nLow Priority (Remediation: 4 weeks):\n- Unnecessary open ports on development servers (4 instances)\n- Outdated WordPress plugins on marketing site\n- Missing audit logging on file server\n- Incomplete asset inventory documentation\n\n**Penetration Testing:**\n- External perimeter test: No exploitable vulnerabilities\n- Internal network assessment: Segmentation effective\n- Social engineering simulation: 12% click rate (improved from 18%)\n- Physical security audit: All controls functioning\n\n**Compliance Status:**\n- GDPR: Fully compliant\n- ISO 27001: Certification renewal on track\n- Industry-specific standards: All requirements met\n\n**Security Metrics:**\n- Phishing detection rate: 94%\n- Patching compliance: 98% within SLA\n- Access review completion: 100%\n- Security training completion: 96%\n\n**Incident Response:**\n- 2 minor incidents detected and resolved\n- Mean time to detect (MTTD): 1.2 hours\n- Mean time to respond (MTTR): 3.5 hours\n\n**Recommendations:**\n1. Implement multi-factor authentication for VPN access\n2. Upgrade endpoint detection and response tools\n3. Conduct quarterly security awareness training\n4. Expand SIEM log coverage to cloud services\n\n**Remediation Timeline:**\n- Week 46: SSL certificate renewals\n- Week 47: Password policy updates\n- Week 48: Security header implementation\n- Week 49-50: Low priority items', FALSE, 'approved'),

(505, 'MBTI2024005', 'Lars Hoffmann', 'Training Program Results - November 2025', 'Corporate Training & Development Summary - November 2025\n\n**Training Statistics:**\n- Total participants: 24 employees\n- Courses completed: 156 hours\n- Pass rate: 96% (23/24)\n- Average satisfaction score: 4.7/5.0\n\n**Certifications Achieved:**\n- Safety Certification Level 2: 18 employees\n- Forklift Operation License: 4 employees  \n- First Aid Certification: 12 employees\n- Quality Management Fundamentals: 8 employees\n\n**Course Offerings This Month:**\n\n1. **Workplace Safety (8 hours)**\n   - Hazard identification and risk assessment\n   - Emergency procedures and evacuation\n   - PPE requirements and usage\n   - Completion: 100%\n\n2. **Quality Control Methods (12 hours)**\n   - Statistical process control\n   - Root cause analysis techniques\n   - Documentation standards\n   - Completion: 87%\n\n3. **Leadership Development (16 hours)**\n   - Team management fundamentals\n   - Conflict resolution strategies\n   - Performance coaching\n   - Completion: 92%\n\n4. **Technical Skills Update (20 hours)**\n   - New equipment operation\n   - Software tools training\n   - Process optimization\n   - Completion: 95%\n\n**Feedback Highlights:**\n✓ "Excellent hands-on exercises"\n✓ "Instructor very knowledgeable"\n✓ "Relevant to daily work"\n△ "Would like more advanced topics"\n△ "Need more time for Q&A"\n\n**December Schedule:**\n- Advanced Manufacturing Techniques: Dec 5-6\n- Cybersecurity Awareness: Dec 12\n- Emergency Response Training: Dec 19\n- Year-end compliance training: Dec 20-21\n\n**Budget Performance:**\n- Allocated: €45,000\n- Spent: €38,200\n- Remaining: €6,800 (allocated for Q1 2026 planning)\n\n**Recommendations:**\n1. Expand e-learning platform for flexible scheduling\n2. Introduce mentorship program for new hires\n3. Partner with university for advanced technical courses', FALSE, 'approved'),

(506, 'MBTI2024837', 'Julia Schneider', 'Code Review - Payment Module Integration', 'Payment Module Code Review - Week 45\n\n**Overview:**\nCompleted comprehensive code review of the new payment integration module developed by external contractor. Review focused on security, performance, and maintainability.\n\n**Files Reviewed:**\n- PaymentGateway.php (450 lines)\n- TransactionProcessor.php (320 lines)\n- RefundHandler.php (180 lines)\n- PaymentValidator.php (210 lines)\n- Associated unit tests (890 lines)\n\n**Security Assessment:**\n\n✓ Strengths:\n- Input validation implemented correctly\n- SQL injection prevention using prepared statements\n- API credentials stored in environment variables\n- PCI-DSS compliance requirements met\n- Encryption for sensitive data in transit\n\n⚠ Issues Found:\n1. **Medium**: Error messages expose internal system details\n   - Recommendation: Implement generic error messages for client\n   - Status: Ticket created (#2891)\n\n2. **Low**: Insufficient logging for audit trail\n   - Recommendation: Add transaction logging with timestamps\n   - Status: Enhancement request (#2892)\n\n3. **Low**: Missing rate limiting on API endpoints\n   - Recommendation: Implement throttling middleware\n   - Status: Added to backlog\n\n**Performance Review:**\n- Database query optimization needed (3 N+1 queries identified)\n- Response time: Average 280ms (acceptable)\n- Memory usage: Within normal parameters\n- Recommendation: Add database indexes on transaction_id and user_id\n\n**Code Quality:**\n- PSR-12 coding standards: 95% compliant\n- Documentation: Well-commented, clear PHPDoc blocks\n- Complexity: Cyclomatic complexity acceptable (avg: 4.2)\n- Test coverage: 87% (target: 90%)\n\n**Unit Testing:**\n✓ All critical paths covered\n✓ Edge cases tested\n✓ Mock objects used appropriately\n△ Integration tests needed for third-party API\n\n**Recommendations Summary:**\n1. Fix error message exposure (Priority: High)\n2. Enhance audit logging (Priority: Medium)\n3. Add rate limiting (Priority: Medium)\n4. Optimize database queries (Priority: Low)\n5. Increase test coverage to 90% (Priority: Low)\n\n**Approval Status:**\nConditional approval - pending fixes for items #1 and #2\nEstimated remediation time: 8-12 hours\n\n**Next Steps:**\n- Developer to address high/medium priority items\n- Re-review scheduled for next sprint\n- Integration testing with staging environment', FALSE, 'approved'),

(507, 'MBTI2024001', 'Thomas Müller', 'Component Testing Results - Suspension System', 'Suspension Component Stress Testing - Final Report\n\n**Test Objective:**\nValidate structural integrity and performance of new adaptive suspension components under extreme conditions.\n\n**Test Specifications:**\n- Component: Active damper assembly (Model: ADS-2025-Pro)\n- Test Duration: 168 hours continuous operation\n- Load Cycles: 500,000 iterations\n- Temperature Range: -40°C to 85°C\n- Vibration Frequency: 5-200 Hz\n\n**Test Results:**\n\n**Structural Integrity:**\n✓ No cracks or deformation detected\n✓ Weld integrity: 100% (ultrasonic inspection)\n✓ Bearing wear: Within tolerance (0.02mm)\n✓ Seal performance: No leakage detected\n✓ Fastener torque: Maintained specifications\n\n**Performance Metrics:**\n- Damping force accuracy: ±2.1% (Spec: ±5%)\n- Response time: 8.2ms (Spec: <10ms)\n- Linearity: R² = 0.998 (Excellent)\n- Hysteresis: 3.4% (Spec: <5%)\n- Temperature stability: ±1.8% deviation\n\n**Thermal Testing:**\n- Cold soak (-40°C, 24h): Pass\n- Heat soak (85°C, 24h): Pass\n- Thermal cycling (100 cycles): Pass\n- No performance degradation observed\n\n**Vibration Testing:**\n- Random vibration (PSD): Pass\n- Sine sweep (5-200 Hz): Pass  \n- Resonance frequency: 47 Hz (within safe range)\n- No fatigue failures detected\n\n**Durability Assessment:**\n- 500,000 cycles completed without failure\n- Projected lifetime: >2 million cycles\n- Estimated service life: 15 years / 250,000 km\n- Maintenance interval: 50,000 km (inspection only)\n\n**Comparison vs. Previous Generation:**\n- Weight: 12% lighter\n- Response time: 35% faster\n- Durability: 2.5x improvement\n- Cost: Comparable\n\n**Quality Assurance:**\n- All measurements traceable to calibrated instruments\n- Test procedures followed ISO 16750-3 standards\n- Data logged and archived\n- Independent verification completed\n\n**Conclusion:**\nComponent exceeds all specification requirements. Recommended for production approval.\n\n**Recommendation:**\n✓ APPROVED for production release\n✓ Update technical documentation\n✓ Initiate supplier qualification process\n✓ Plan production ramp-up for Q1 2026', FALSE, 'approved'),

(508, 'MBTI2024002', 'Sarah Schmidt', 'Material Analysis Report - Alternative Battery Chemistries', 'Comparative Analysis: Alternative Battery Materials\n\n**Study Objective:**\nEvaluate viability of alternative cathode materials to reduce dependency on cobalt and improve cost-effectiveness.\n\n**Materials Evaluated:**\n1. NMC 811 (Nickel Manganese Cobalt)\n2. NCA (Nickel Cobalt Aluminum)  \n3. LFP (Lithium Iron Phosphate)\n4. LNMO (Lithium Nickel Manganese Oxide)\n\n**Test Parameters:**\n- Sample size: 50 cells per chemistry\n- Test duration: 12 weeks\n- Charge/discharge cycles: 1000+\n- Temperature conditions: 25°C, 45°C, -10°C\n- C-rate testing: 0.5C, 1C, 2C\n\n**Performance Comparison:**\n\n**Energy Density (Wh/kg):**\n- NMC 811: 285 ⭐\n- NCA: 278\n- LFP: 165\n- LNMO: 240\n\n**Cycle Life (80% capacity retention):**\n- NMC 811: 1200 cycles\n- NCA: 1100 cycles  \n- LFP: 3000 cycles ⭐\n- LNMO: 1800 cycles\n\n**Safety Performance:**\n- NMC 811: Good (thermal runaway at 210°C)\n- NCA: Moderate (thermal runaway at 195°C)\n- LFP: Excellent (thermal runaway at 270°C) ⭐\n- LNMO: Good (thermal runaway at 225°C)\n\n**Cost Analysis ($/kWh):**\n- NMC 811: $142\n- NCA: $156\n- LFP: $98 ⭐\n- LNMO: $128\n\n**Environmental Impact:**\n- Cobalt content (NMC 811): 10%\n- Cobalt content (NCA): 15%\n- Cobalt content (LFP): 0% ⭐\n- Cobalt content (LNMO): 0% ⭐\n\n**Recommendations by Application:**\n\n**Premium Vehicles (Long Range):**\n- Primary: NMC 811\n- Rationale: Highest energy density, acceptable cost\n\n**Mid-Range Vehicles:**\n- Primary: LNMO\n- Rationale: Balanced performance/cost/safety\n\n**Commercial Vehicles / Buses:**\n- Primary: LFP\n- Rationale: Best cycle life, safety, and cost\n\n**Performance Vehicles:**\n- Primary: NCA\n- Rationale: High power capability\n\n**Strategic Recommendations:**\n1. Diversify battery chemistry portfolio\n2. Phase out high-cobalt chemistries by 2027\n3. Invest in LFP technology for mass-market vehicles\n4. Continue R&D on LNMO improvements\n5. Establish dual-source supply chain\n\n**Cost-Benefit Summary:**\n- LFP adoption could reduce battery costs by 31%\n- Eliminate cobalt supply chain risk\n- Improve sustainability profile\n- Trade-off: 15% reduction in vehicle range\n\n**Next Steps:**\n- Prototype vehicle testing with LFP packs\n- Supplier negotiations for LFP materials\n- Customer acceptance research\n- Lifecycle analysis update', FALSE, 'approved'),

(509, 'MBTI2024003', 'Michael Weber', 'Maintenance Schedule Optimization Report', 'Preventive Maintenance Program Optimization - Q4 2025\n\n**Project Overview:**\nAnalyzed 18 months of maintenance data to optimize preventive maintenance schedules, reduce unplanned downtime, and improve cost efficiency.\n\n**Current State Analysis:**\n- Unplanned downtime: 4.2% of total production time\n- Preventive maintenance: 2.1% of total production time  \n- Total maintenance cost: €284,000/quarter\n- Emergency repairs: 18% of all maintenance events\n\n**Data Analysis:**\n- Equipment failure patterns analyzed\n- MTBF (Mean Time Between Failures) calculated for all critical assets\n- Predictive indicators identified\n- Maintenance task duration measured\n\n**Key Findings:**\n\n1. **Over-Maintained Equipment:**\n   - Conveyor systems: Serviced 30% more frequently than needed\n   - Robotic welders: Daily checks excessive (weekly sufficient)\n   - HVAC systems: Monthly filter changes wasteful (quarterly adequate)\n\n2. **Under-Maintained Equipment:**\n   - Hydraulic pumps: 3 failures due to inadequate inspection frequency\n   - Electrical panels: Annual inspection insufficient (quarterly recommended)\n   - Compressed air systems: Leak detection needed more frequently\n\n3. **Inefficient Scheduling:**\n   - 40% of maintenance performed during peak production hours\n   - Insufficient coordination between departments\n   - Spare parts stockouts causing delays in 12% of repairs\n\n**Optimized Maintenance Schedule:**\n\n**Daily Tasks:** (Reduced from 48 to 32)\n- Critical safety checks only\n- Visual inspections of high-risk equipment\n- Production line startup procedures\n\n**Weekly Tasks:** (Increased from 15 to 22)\n- Lubrication schedules\n- Precision equipment calibration\n- Quality control instrument verification\n\n**Monthly Tasks:** (Optimized from 35 to 28)\n- Comprehensive equipment inspection\n- Predictive maintenance diagnostics\n- Safety system testing\n\n**Quarterly Tasks:** (New category - 12 tasks)\n- Major equipment overhaul\n- Compliance inspections\n- Facility-wide assessments\n\n**Implementation Results (8-week pilot):**\n- Unplanned downtime: Reduced to 2.8% (33% improvement)\n- Maintenance costs: Reduced to €245,000/quarter (14% savings)\n- Equipment availability: Increased to 97.2%\n- Emergency repairs: Reduced to 9% of all maintenance\n\n**Cost-Benefit Analysis:**\n- Annual savings: €156,000\n- Implementation cost: €28,000\n- ROI: 557%\n- Payback period: 2.2 months\n\n**Additional Benefits:**\n- Extended equipment lifespan (projected 15%)\n- Improved worker safety (fewer emergency situations)\n- Better production planning (predictable maintenance windows)\n- Reduced spare parts inventory (optimized stock levels)\n\n**Recommendations:**\n1. Rollout optimized schedule company-wide\n2. Invest in predictive maintenance sensors (€85,000)\n3. Implement CMMS (Computerized Maintenance Management System)\n4. Train maintenance team on new procedures\n5. Establish KPIs for continuous improvement\n\n**Implementation Timeline:**\n- Week 46-47: Staff training\n- Week 48: Update documentation\n- Week 49: CMMS deployment\n- Week 50-52: Phased rollout\n- Q1 2026: Full implementation', FALSE, 'approved'),

(510, 'MBTI2024837', 'Julia Schneider', 'Weekly Development Update - Week 46', 'Week 46 Development Summary\n\n**Completed Tasks:**\n- Implemented responsive dashboard layout for mobile devices\n- Fixed authentication bug in session management (Ticket #2847)\n- Refactored user profile component to use new API endpoints\n- Updated documentation for REST API v2.3\n\n**Code Reviews:**\n- Reviewed PRs from Thomas (vehicle connectivity module) and Sarah (battery monitoring dashboard)\n- Suggested performance improvements for database queries in the reporting module\n\n**Testing:**\n- All unit tests passing (98% code coverage)\n- Integration tests completed for user management features\n- Regression testing identified one minor CSS issue (fixed)\n\n**Blockers/Challenges:**\n- Waiting for design team approval on new color scheme\n- Need clarification on data retention policy for audit logs\n\n**Next Week Plans:**\n- Begin implementation of notification system\n- Conduct code review training session for junior developers\n- Performance optimization for report generation module\n\n**Hours Logged:** 42 hours\n**Status:** On track for Q4 release', FALSE, 'approved'),

(511, 'MBTI2024005', 'Lars Hoffmann', 'Workshop Feedback Summary - Advanced Manufacturing', 'Advanced Manufacturing Techniques Workshop - Participant Feedback Analysis\n\n**Workshop Details:**\n- Date: November 8-9, 2025\n- Duration: 16 hours (2 full days)\n- Participants: 22 employees (18 production, 4 engineering)\n- Instructor: Dr. Heinrich Bauer (External consultant)\n- Location: Training Center Building C\n\n**Curriculum Covered:**\n- Industry 4.0 principles and applications\n- Lean manufacturing advanced techniques  \n- Statistical process control (SPC) methods\n- Root cause analysis (8D methodology)\n- Kaizen and continuous improvement culture\n- Practical exercises with production equipment\n\n**Feedback Summary (22 responses):**\n\n**Overall Satisfaction: 4.6 / 5.0**\n- Excellent: 68%\n- Good: 27%\n- Satisfactory: 5%\n- Poor: 0%\n\n**Content Quality:**\n- Relevance to job: 4.8/5.0\n- Depth of coverage: 4.5/5.0\n- Practical applicability: 4.7/5.0\n- Course materials: 4.4/5.0\n\n**Instructor Effectiveness:**\n- Knowledge of subject: 4.9/5.0 ⭐\n- Teaching ability: 4.7/5.0\n- Engagement: 4.6/5.0\n- Responsiveness to questions: 4.8/5.0\n\n**Logistics:**\n- Facility quality: 4.3/5.0\n- Equipment availability: 4.2/5.0\n- Schedule appropriateness: 4.0/5.0\n- Refreshments: 4.1/5.0\n\n**Participant Comments:**\n\nPositive Feedback:\n✓ "Best training I\'ve attended in 5 years"\n✓ "Dr. Bauer explained complex concepts very clearly"\n✓ "Hands-on exercises were extremely valuable"\n✓ "Immediately applicable to my daily work"\n✓ "Would love more advanced sessions like this"\n✓ "Great balance of theory and practice"\n\nSuggestions for Improvement:\n△ "Would benefit from more time - maybe 3 days"\n△ "Need follow-up session in 6 months"\n△ "More time for Q&A discussions"\n△ "Provide digital version of materials"\n△ "Include more case studies from our industry"\n\n**Knowledge Assessment:**\nPre-test average: 62%\nPost-test average: 89%\nImprovement: 27 percentage points ⭐\n\n**Skills Application (30-day follow-up):**\n- 18 participants implemented at least one technique\n- 12 initiated improvement projects\n- 5 trained colleagues on workshop content\n- Estimated productivity gain: 8-12%\n\n**ROI Calculation:**\n- Training investment: €12,400\n- Projected annual productivity gain: €94,000\n- ROI: 758%\n- Payback period: 1.6 months\n\n**Recommendations:**\n1. Schedule follow-up advanced workshop (Q2 2026)\n2. Create digital learning portal with workshop materials\n3. Establish monthly practice sessions for skill reinforcement\n4. Invite Dr. Bauer for quarterly consulting visits\n5. Develop internal trainers from top performers\n6. Expand program to other departments\n\n**Next Steps:**\n- Compile and distribute workshop recordings\n- Create implementation support guide\n- Schedule 90-day progress review\n- Plan advanced Level 2 workshop\n- Allocate budget for 2026 training calendar', FALSE, 'approved');


