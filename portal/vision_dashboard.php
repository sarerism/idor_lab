<?php
session_start();

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.php');
    exit();
}

require_once 'config.php';

$employee_id = $_SESSION['employee_id'] ?? 'Unknown';
$full_name = $_SESSION['full_name'] ?? 'Employee';
$email = $_SESSION['email'] ?? '';
$department = $_SESSION['department'] ?? '';
$role = $_SESSION['role'] ?? '';

// Fetch some statistics
$total_employees_query = "SELECT COUNT(*) as total FROM employees";
$total_employees = $conn->query($total_employees_query)->fetch_assoc()['total'];

$departments_query = "SELECT department, COUNT(*) as count FROM employees GROUP BY department";
$departments_result = $conn->query($departments_query);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vision UI Dashboard - MBTI Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --brand-50: #cbbff8;
            --brand-100: #876cea;
            --brand-200: #582CFF;
            --brand-300: #542de1;
            --brand-400: #4a25d0;
            --brand-500: #3915bc;
            --brand-600: #300eaa;
            --brand-700: #1c0377;
            --brand-800: #130156;
            --brand-900: #0e0042;
            
            --gray-50: #f7fafc;
            --gray-100: #edf2f7;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e0;
            --gray-400: #a0aec0;
            --gray-500: #718096;
            --gray-600: #4a5568;
            --gray-700: #2d3748;
            --gray-800: #1a202c;
            --gray-900: #171923;
            
            --bg-dark: #0b1437;
            --bg-darker: #060b27;
            --card-bg: rgba(13, 19, 49, 0.9);
        }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(159deg, #0b1437 0%, #060b27 100%);
            min-height: 100vh;
            color: #fff;
            position: relative;
            overflow-x: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(ellipse at top, rgba(88, 44, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at bottom right, rgba(88, 44, 255, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }

        .dashboard-container {
            display: flex;
            min-height: 100vh;
            position: relative;
            z-index: 1;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background: rgba(13, 19, 49, 0.6);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            padding: 32px 24px;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .sidebar::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(180deg, 
                transparent 0%, 
                rgba(88, 44, 255, 0.3) 50%, 
                transparent 100%);
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 48px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, var(--brand-200) 0%, var(--brand-400) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 8px 24px rgba(88, 44, 255, 0.4);
        }

        .logo-text {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .nav-section {
            margin-bottom: 32px;
        }

        .nav-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.4);
            margin-bottom: 16px;
            padding: 0 16px;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 15px;
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 8px;
            cursor: pointer;
            position: relative;
        }

        .nav-item:hover {
            background: rgba(88, 44, 255, 0.1);
            color: #fff;
            transform: translateX(4px);
        }

        .nav-item.active {
            background: linear-gradient(135deg, rgba(88, 44, 255, 0.25) 0%, rgba(88, 44, 255, 0.1) 100%);
            color: #fff;
            box-shadow: 0 4px 20px rgba(88, 44, 255, 0.3);
        }

        .nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 20px;
            background: linear-gradient(180deg, var(--brand-200) 0%, var(--brand-400) 100%);
            border-radius: 0 4px 4px 0;
        }

        .nav-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
        }

        .user-profile {
            margin-top: auto;
            padding: 16px;
            background: rgba(88, 44, 255, 0.1);
            border-radius: 15px;
            border: 1px solid rgba(88, 44, 255, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--brand-200) 0%, var(--brand-400) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
        }

        .user-info {
            flex: 1;
        }

        .user-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 2px;
        }

        .user-role {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        /* Main Content */
        .main-content {
            flex: 1;
            padding: 32px;
            overflow-y: auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .welcome {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
        }

        .header-actions {
            display: flex;
            gap: 12px;
        }

        .action-btn {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .action-btn.primary {
            background: linear-gradient(135deg, var(--brand-200) 0%, var(--brand-400) 100%);
            border: none;
            box-shadow: 0 8px 24px rgba(88, 44, 255, 0.4);
        }

        .action-btn.primary:hover {
            box-shadow: 0 12px 32px rgba(88, 44, 255, 0.5);
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(88, 44, 255, 0.5) 50%, 
                transparent 100%);
        }

        .stat-card:hover {
            transform: translateY(-4px);
            border-color: rgba(88, 44, 255, 0.3);
            box-shadow: 0 20px 40px rgba(88, 44, 255, 0.2);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(88, 44, 255, 0.2) 0%, rgba(88, 44, 255, 0.05) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .stat-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            margin-bottom: 8px;
        }

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.9) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .stat-change {
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .stat-change.positive {
            color: #48bb78;
        }

        .stat-change.negative {
            color: #f56565;
        }

        /* Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 28px;
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(88, 44, 255, 0.5) 50%, 
                transparent 100%);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .card-title {
            font-size: 18px;
            font-weight: 700;
        }

        .card-action {
            color: var(--brand-200);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .card-action:hover {
            color: var(--brand-100);
        }

        /* Progress Bar */
        .progress-item {
            margin-bottom: 20px;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .progress-label {
            font-size: 14px;
            font-weight: 600;
        }

        .progress-value {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
        }

        .progress-bar {
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-200) 0%, var(--brand-300) 100%);
            border-radius: 4px;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(90deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.3) 50%, 
                transparent 100%);
            animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
            0% {
                transform: translateX(-100%);
            }
            100% {
                transform: translateX(100%);
            }
        }

        /* Table */
        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.5);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        td {
            padding: 16px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        tr {
            transition: background 0.2s;
        }

        tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }

        .employee-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .employee-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--brand-200) 0%, var(--brand-400) 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 12px;
        }

        .employee-info {
            flex: 1;
        }

        .employee-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 2px;
        }

        .employee-dept {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
        }

        .status-badge {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(72, 187, 120, 0.1);
            color: #48bb78;
        }

        .status-badge.offline {
            background: rgba(160, 174, 192, 0.1);
            color: var(--gray-400);
        }

        /* Animation */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .stat-card, .card {
            animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }

        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }

        /* Calendar Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s;
        }

        .modal-overlay.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .calendar-modal {
            background: var(--card-bg);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 32px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(40px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .modal-title {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .modal-close {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(90deg);
        }

        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .calendar-month {
            font-size: 24px;
            font-weight: 700;
        }

        .calendar-nav {
            display: flex;
            gap: 8px;
        }

        .calendar-nav-btn {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .calendar-nav-btn:hover {
            background: rgba(88, 44, 255, 0.2);
            border-color: var(--brand-200);
        }

        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 8px;
            margin-bottom: 24px;
        }

        .calendar-day-header {
            text-align: center;
            padding: 12px;
            font-size: 12px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        .calendar-day:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(88, 44, 255, 0.3);
            transform: scale(1.05);
        }

        .calendar-day.empty {
            background: transparent;
            border: none;
            cursor: default;
        }

        .calendar-day.empty:hover {
            transform: none;
        }

        .calendar-day.today {
            background: linear-gradient(135deg, rgba(88, 44, 255, 0.3) 0%, rgba(88, 44, 255, 0.15) 100%);
            border-color: var(--brand-200);
        }

        .calendar-day.has-event::after {
            content: '';
            position: absolute;
            bottom: 4px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--brand-200);
        }

        .calendar-day-number {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
        }

        .calendar-day-label {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.5);
            text-align: center;
            line-height: 1.2;
        }

        .events-section {
            margin-top: 32px;
        }

        .events-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .event-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            gap: 16px;
            align-items: center;
            transition: all 0.3s;
        }

        .event-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(88, 44, 255, 0.3);
            transform: translateX(4px);
        }

        .event-date {
            min-width: 60px;
            text-align: center;
        }

        .event-day {
            font-size: 24px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 4px;
        }

        .event-month {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }

        .event-details {
            flex: 1;
        }

        .event-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
        }

        .event-time {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
        }

        .event-badge {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(88, 44, 255, 0.2);
            color: var(--brand-100);
    <!-- Calendar Modal -->
    <div class="modal-overlay" id="calendarModal">
        <div class="calendar-modal">
            <div class="modal-header">
                <div class="modal-title">📅 Schedule - November 2025</div>
                <button class="modal-close" onclick="closeCalendar()">×</button>
            </div>

            <div class="calendar-header">
                <div class="calendar-month">November 2025</div>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn">←</button>
                    <button class="calendar-nav-btn">→</button>
                </div>
            </div>

            <div class="calendar-grid">
                <div class="calendar-day-header">Sun</div>
                <div class="calendar-day-header">Mon</div>
                <div class="calendar-day-header">Tue</div>
                <div class="calendar-day-header">Wed</div>
                <div class="calendar-day-header">Thu</div>
                <div class="calendar-day-header">Fri</div>
                <div class="calendar-day-header">Sat</div>

                <!-- Week 1 -->
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day"><div class="calendar-day-number">1</div></div>

                <!-- Week 2 -->
                <div class="calendar-day"><div class="calendar-day-number">2</div></div>
                <div class="calendar-day"><div class="calendar-day-number">3</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">4</div><div class="calendar-day-label">Meeting</div></div>
                <div class="calendar-day"><div class="calendar-day-number">5</div></div>
                <div class="calendar-day"><div class="calendar-day-number">6</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">7</div><div class="calendar-day-label">Review</div></div>
                <div class="calendar-day"><div class="calendar-day-number">8</div></div>

                <!-- Week 3 -->
                <div class="calendar-day"><div class="calendar-day-number">9</div></div>
                <div class="calendar-day"><div class="calendar-day-number">10</div></div>
                <div class="calendar-day"><div class="calendar-day-number">11</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">12</div><div class="calendar-day-label">Task</div></div>
                <div class="calendar-day"><div class="calendar-day-number">13</div></div>
                <div class="calendar-day"><div class="calendar-day-number">14</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">15</div><div class="calendar-day-label">Meeting</div></div>

                <!-- Week 4 -->
                <div class="calendar-day"><div class="calendar-day-number">16</div></div>
                <div class="calendar-day"><div class="calendar-day-number">17</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">18</div><div class="calendar-day-label">Task</div></div>
                <div class="calendar-day"><div class="calendar-day-number">19</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">20</div><div class="calendar-day-label">Meeting</div></div>
                <div class="calendar-day"><div class="calendar-day-number">21</div></div>
                <div class="calendar-day"><div class="calendar-day-number">22</div></div>

                <!-- Week 5 -->
                <div class="calendar-day"><div class="calendar-day-number">23</div></div>
                <div class="calendar-day"><div class="calendar-day-number">24</div></div>
                <div class="calendar-day has-event"><div class="calendar-day-number">25</div><div class="calendar-day-label">Review</div></div>
                <div class="calendar-day"><div class="calendar-day-number">26</div></div>
                <div class="calendar-day"><div class="calendar-day-number">27</div></div>
                <div class="calendar-day today has-event"><div class="calendar-day-number">28</div><div class="calendar-day-label">Today</div></div>
                <div class="calendar-day"><div class="calendar-day-number">29</div></div>

                <!-- Week 6 -->
                <div class="calendar-day"><div class="calendar-day-number">30</div></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
                <div class="calendar-day empty"></div>
            </div>

            <div class="events-section">
                <div class="events-title">Upcoming Events</div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">4</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Team Standup Meeting</div>
                        <div class="event-time">9:00 AM - 9:30 AM • Conference Room A</div>
                    </div>
                    <div class="event-badge meeting">Meeting</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">7</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Quarterly Code Review</div>
                        <div class="event-time">2:00 PM - 4:00 PM • Virtual</div>
                    </div>
                    <div class="event-badge review">Review</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">12</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Complete EV Platform Documentation</div>
                        <div class="event-time">Due: 5:00 PM</div>
                    </div>
                    <div class="event-badge task">Task</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">15</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Department Planning Session</div>
                        <div class="event-time">10:00 AM - 12:00 PM • Board Room</div>
                    </div>
                    <div class="event-badge meeting">Meeting</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">18</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Update Security Framework Tests</div>
                        <div class="event-time">Due: 6:00 PM</div>
                    </div>
                    <div class="event-badge task">Task</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">20</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Client Presentation - AI Driver Assistant</div>
                        <div class="event-time">3:00 PM - 4:30 PM • Executive Suite</div>
                    </div>
                    <div class="event-badge meeting">Meeting</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">25</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Sprint Retrospective</div>
                        <div class="event-time">1:00 PM - 2:00 PM • Virtual</div>
                    </div>
                    <div class="event-badge review">Review</div>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">28</div>
                        <div class="event-month">NOV</div>
                    </div>
                    <div class="event-details">
                        <div class="event-title">Weekly Progress Sync</div>
                        <div class="event-time">11:00 AM - 11:30 AM • Your desk</div>
                    </div>
                    <div class="event-badge meeting">Meeting</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Calendar Functions
        function openCalendar() {
            const modal = document.getElementById('calendarModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeCalendar() {
            const modal = document.getElementById('calendarModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }

        // Initialize calendar modal when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            // Close modal on overlay click
            const modalOverlay = document.getElementById('calendarModal');
            if (modalOverlay) {
                modalOverlay.addEventListener('click', function(e) {
                    if (e.target === this) {
                        closeCalendar();
                    }
                });
            }

            // Close modal on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeCalendar();
                }
            });
        });

        // Animate progress bars on load
        window.addEventListener('load', () => {
            const progressFills = document.querySelectorAll('.progress-fill');
            progressFills.forEach(fill => {
                const width = fill.style.width;
                fill.style.width = '0%';
                setTimeout(() => {
                    fill.style.width = width;
                }, 100);
            });
        });

        // Add hover effects
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px) scale(1.02)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    </script>
            .calendar-modal {
                width: 95%;
                padding: 24px;
            }
        }

        @media (max-width: 768px) {
            .sidebar {
                position: fixed;
                left: -280px;
                transition: left 0.3s;
                z-index: 100;
            }

            .sidebar.open {
                left: 0;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .calendar-grid {
                gap: 4px;
            }
            
            .calendar-day {
                padding: 4px;
            }
            
            .calendar-day-number {
                font-size: 12px;
            }
            
            .calendar-day-label {
                font-size: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="logo">
                <div class="logo-icon" style="background: linear-gradient(135deg, #582CFF 0%, #4a25d0 100%); box-shadow: 0 8px 24px rgba(88, 44, 255, 0.4);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 22V12H15V22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="logo-text">MBTI PORTAL</div>
            </div>

            <div class="nav-section">
                <div class="nav-title">Main</div>
                <a href="?page=home" class="nav-item active">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Dashboard</span>
                </a>
                <a href="?page=reports" class="nav-item">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 20V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Reports</span>
                </a>
                <a href="?page=projects" class="nav-item">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Projects</span>
                </a>
            </div>

            <div class="nav-section">
                <div class="nav-title">Account</div>
                <a href="?page=profile" class="nav-item">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Profile</span>
                </a>
                <a href="?page=settings" class="nav-item">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Settings</span>
                </a>
                <a href="logout.php" class="nav-item">
                    <span class="nav-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 17L21 12L16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Logout</span>
                </a>
            </div>

            <div class="user-profile">
                <div class="user-avatar"><?php echo strtoupper(substr($full_name, 0, 1)); ?></div>
                <div class="user-info">
                    <div class="user-name"><?php echo htmlspecialchars(explode(' ', $full_name)[0]); ?></div>
                    <div class="user-role"><?php echo htmlspecialchars($role); ?></div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="header">
                <div>
                    <div class="welcome">Welcome back, <?php echo htmlspecialchars(explode(' ', $full_name)[0]); ?>! 👋</div>
                    <div class="subtitle">Here's what's happening with your workspace today</div>
                </div>
                <div class="header-actions">
                    <button class="action-btn" onclick="openCalendar()">📅 Schedule</button>
                    <button class="action-btn primary">+ New Project</button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon">💰</div>
                    </div>
                    <div class="stat-label">Total Employees</div>
                    <div class="stat-value"><?php echo number_format($total_employees); ?></div>
                    <div class="stat-change positive">
                        <span>▲</span>
                        <span>+8% from last month</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon">🌍</div>
                    </div>
                    <div class="stat-label">Active Projects</div>
                    <div class="stat-value">12</div>
                    <div class="stat-change positive">
                        <span>▲</span>
                        <span>+3% from yesterday</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon">✨</div>
                    </div>
                    <div class="stat-label">Completion Rate</div>
                    <div class="stat-value">87%</div>
                    <div class="stat-change positive">
                        <span>▲</span>
                        <span>+12% from last week</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon">📦</div>
                    </div>
                    <div class="stat-label">Department</div>
                    <div class="stat-value"><?php echo htmlspecialchars($department); ?></div>
                    <div class="stat-change" style="color: rgba(255,255,255,0.6);">
                        <span>Your division</span>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="content-grid">
                <!-- Projects Progress -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Active Projects</div>
                        <div class="card-action">View all →</div>
                    </div>

                    <div class="progress-item">
                        <div class="progress-header">
                            <div class="progress-label">🚗 Electric Vehicle Platform</div>
                            <div class="progress-value">82%</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 82%"></div>
                        </div>
                    </div>

                    <div class="progress-item">
                        <div class="progress-header">
                            <div class="progress-label">🔋 Battery Management System</div>
                            <div class="progress-value">65%</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 65%"></div>
                        </div>
                    </div>

                    <div class="progress-item">
                        <div class="progress-header">
                            <div class="progress-label">🤖 AI Driver Assistant</div>
                            <div class="progress-value">91%</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 91%"></div>
                        </div>
                    </div>

                    <div class="progress-item">
                        <div class="progress-header">
                            <div class="progress-label">🛡️ Cybersecurity Framework</div>
                            <div class="progress-value">48%</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 48%"></div>
                        </div>
                    </div>
                </div>

                <!-- Department Overview -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Department Stats</div>
                        <div class="card-action">Details →</div>
                    </div>

                    <?php
                    if ($departments_result && $departments_result->num_rows > 0) {
                        while ($dept = $departments_result->fetch_assoc()) {
                            $percentage = ($dept['count'] / $total_employees) * 100;
                            echo '<div class="progress-item">';
                            echo '<div class="progress-header">';
                            echo '<div class="progress-label">' . htmlspecialchars($dept['department']) . '</div>';
                            echo '<div class="progress-value">' . $dept['count'] . '</div>';
                            echo '</div>';
                            echo '<div class="progress-bar">';
                            echo '<div class="progress-fill" style="width: ' . $percentage . '%"></div>';
                            echo '</div>';
                            echo '</div>';
                        }
                    }
                    ?>
                </div>
            </div>

            <!-- Team Members Table -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Activity</div>
                    <div class="card-action">View all →</div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $recent_query = "SELECT * FROM employees ORDER BY created_at DESC LIMIT 5";
                            $recent_result = $conn->query($recent_query);
                            
                            if ($recent_result && $recent_result->num_rows > 0) {
                                while ($emp = $recent_result->fetch_assoc()) {
                                    $initial = strtoupper(substr($emp['full_name'], 0, 1));
                                    $status = (rand(0, 1) === 1) ? 'Online' : 'Offline';
                                    $status_class = ($status === 'Online') ? '' : 'offline';
                                    
                                    echo '<tr>';
                                    echo '<td>';
                                    echo '<div class="employee-cell">';
                                    echo '<div class="employee-avatar">' . $initial . '</div>';
                                    echo '<div class="employee-info">';
                                    echo '<div class="employee-name">' . htmlspecialchars($emp['full_name']) . '</div>';
                                    echo '<div class="employee-dept">' . htmlspecialchars($emp['email']) . '</div>';
                                    echo '</div>';
                                    echo '</div>';
                                    echo '</td>';
                                    echo '<td>' . htmlspecialchars($emp['department']) . '</td>';
                                    echo '<td>' . htmlspecialchars($emp['role']) . '</td>';
                                    echo '<td><span class="status-badge ' . $status_class . '">' . $status . '</span></td>';
                                    echo '</tr>';
                                }
                            }
                            ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Animate progress bars on load
        window.addEventListener('load', () => {
            const progressFills = document.querySelectorAll('.progress-fill');
            progressFills.forEach(fill => {
                const width = fill.style.width;
                fill.style.width = '0%';
                setTimeout(() => {
                    fill.style.width = width;
                }, 100);
            });
        });

        // Add hover effects
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px) scale(1.02)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    </script>
</body>
</html>
