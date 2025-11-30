<?php
session_start();

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: login.php');
    exit();
}

require_once 'config.php';

$employee_id = $_SESSION['employee_id'] ?? 'Unknown';
$full_name = $_SESSION['full_name'] ?? 'Employee';
$current_user_id = $_SESSION['employee_id'];

// Get chat_id from URL or default to first available
$chat_id = $_GET['chat_id'] ?? '1';
$view = $_GET['view'] ?? 'chat'; // chat, teams, calendar, calls, files

// Fetch all employees for the sidebar
$employees_query = "SELECT employee_id, full_name, department, role FROM employees ORDER BY full_name";
$employees_result = $conn->query($employees_query);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MBTI Teams - Collaboration Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f3f2f1;
            color: #323130;
            overflow: hidden;
        }

        .teams-container {
            display: flex;
            height: 100vh;
        }

        /* Left Sidebar - Navigation */
        .sidebar-left {
            width: 68px;
            background: #464775;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 0;
            gap: 8px;
        }

        .nav-item {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
            color: #fff;
            text-decoration: none;
            font-size: 20px;
            position: relative;
        }

        .nav-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .nav-item.active {
            background: rgba(255, 255, 255, 0.15);
        }

        .nav-item.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 24px;
            background: #6264a7;
        }

        /* Middle Sidebar - Channels/Chats */
        .sidebar-middle {
            width: 320px;
            background: #faf9f8;
            border-right: 1px solid #e1dfdd;
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e1dfdd;
        }

        .sidebar-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .search-box {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #e1dfdd;
            border-radius: 4px;
            font-size: 14px;
            background: #fff;
        }

        .chat-list {
            flex: 1;
            overflow-y: auto;
        }

        .chat-item {
            padding: 12px 20px;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chat-item:hover {
            background: #f3f2f1;
        }

        .chat-item.active {
            background: #e1dfdd;
            border-left-color: #6264a7;
        }

        .chat-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #6264a7;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            flex-shrink: 0;
        }

        .chat-info {
            flex: 1;
            min-width: 0;
        }

        .chat-name {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .chat-preview {
            font-size: 12px;
            color: #605e5c;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .chat-meta {
            font-size: 11px;
            color: #8a8886;
        }

        /* Main Chat Area */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #fff;
        }

        .chat-header {
            height: 56px;
            border-bottom: 1px solid #e1dfdd;
            display: flex;
            align-items: center;
            padding: 0 24px;
            gap: 12px;
        }

        .chat-header-title {
            flex: 1;
            font-size: 16px;
            font-weight: 600;
        }

        .chat-header-subtitle {
            font-size: 12px;
            color: #605e5c;
        }

        .chat-header-actions {
            display: flex;
            gap: 8px;
        }

        .action-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .action-btn:hover {
            background: #f3f2f1;
        }

        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .message {
            display: flex;
            gap: 12px;
        }

        .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #6264a7;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 12px;
            flex-shrink: 0;
        }

        .message-content {
            flex: 1;
        }

        .message-header {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin-bottom: 4px;
        }

        .message-author {
            font-weight: 600;
            font-size: 14px;
        }

        .message-time {
            font-size: 12px;
            color: #8a8886;
        }

        .message-text {
            font-size: 14px;
            line-height: 20px;
            color: #323130;
        }

        .message-reactions {
            display: flex;
            gap: 4px;
            margin-top: 8px;
        }

        .reaction {
            padding: 2px 8px;
            border: 1px solid #e1dfdd;
            border-radius: 12px;
            font-size: 12px;
            background: #f3f2f1;
            cursor: pointer;
        }

        .reaction:hover {
            background: #e1dfdd;
        }

        /* Composer */
        .chat-composer {
            border-top: 1px solid #e1dfdd;
            padding: 16px 24px;
        }

        .composer-box {
            border: 1px solid #e1dfdd;
            border-radius: 4px;
            min-height: 64px;
            padding: 12px;
            background: #fff;
        }

        .composer-input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 14px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            resize: none;
        }

        .composer-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
        }

        .composer-tools {
            display: flex;
            gap: 8px;
        }

        .tool-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tool-btn:hover {
            background: #f3f2f1;
        }

        .send-btn {
            padding: 6px 16px;
            background: #6264a7;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
        }

        .send-btn:hover {
            background: #575A94;
        }

        .send-btn:disabled {
            background: #c8c6c4;
            cursor: not-allowed;
        }

        /* Right Sidebar - Details */
        .sidebar-right {
            width: 320px;
            background: #faf9f8;
            border-left: 1px solid #e1dfdd;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .details-header {
            padding: 24px 20px;
            text-align: center;
            border-bottom: 1px solid #e1dfdd;
        }

        .details-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #6264a7;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 32px;
            margin: 0 auto 12px;
        }

        .details-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .details-status {
            font-size: 14px;
            color: #605e5c;
        }

        .details-section {
            padding: 20px;
            border-bottom: 1px solid #e1dfdd;
        }

        .details-section-title {
            font-size: 12px;
            font-weight: 600;
            color: #605e5c;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .detail-label {
            color: #605e5c;
        }

        .detail-value {
            font-weight: 600;
        }

        .tabs {
            display: flex;
            padding: 12px 20px;
            gap: 16px;
            border-bottom: 1px solid #e1dfdd;
        }

        .tab {
            padding: 8px 0;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            color: #605e5c;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .tab:hover {
            color: #323130;
        }

        .tab.active {
            color: #6264a7;
            border-bottom-color: #6264a7;
        }

        .presence-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #92c353;
            border: 2px solid #fff;
            position: absolute;
            bottom: 0;
            right: 0;
        }

        .presence-indicator.busy {
            background: #c50f1f;
        }

        .presence-indicator.away {
            background: #f8d22a;
        }

        .avatar-wrapper {
            position: relative;
        }

        .logout-btn {
            margin-top: auto;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            text-align: center;
        }

        .logout-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body>
    <div class="teams-container">
        <!-- Left Navigation -->
        <div class="sidebar-left">
            <div class="nav-item active" title="Activity">💬</div>
            <div class="nav-item" title="Chat">💭</div>
            <div class="nav-item" title="Teams">👥</div>
            <div class="nav-item" title="Calendar">📅</div>
            <div class="nav-item" title="Calls">📞</div>
            <div class="nav-item" title="Files">📁</div>
            <div class="logout-btn" onclick="window.location.href='logout.php'" title="Logout">⏻</div>
        </div>

        <!-- Middle Sidebar - Channels/Chats -->
        <div class="sidebar-middle">
            <div class="sidebar-header">
                <div class="sidebar-title">Chats</div>
                <input type="text" class="search-box" placeholder="Search" id="searchInput">
            </div>
            <div class="chat-list" id="chatList">
                <?php
                $colors = ['#6264a7', '#8764b8', '#117865', '#c239b3', '#d74654', '#00a7b8', '#5558af'];
                $messages_preview = [
                    'Hey, can you review the latest specs?',
                    'Meeting at 2 PM today',
                    'The deployment was successful 🎉',
                    'Quick question about the project',
                    'Thanks for the update!',
                    'Let\'s schedule a call'
                ];
                
                if ($employees_result && $employees_result->num_rows > 0) {
                    $index = 0;
                    while ($emp = $employees_result->fetch_assoc()) {
                        if ($emp['employee_id'] === $current_user_id) continue;
                        
                        $is_active = ($chat_id == ($index + 1)) ? 'active' : '';
                        $initials = strtoupper(substr($emp['full_name'], 0, 1));
                        $color = $colors[$index % count($colors)];
                        $preview = $messages_preview[$index % count($messages_preview)];
                        $time = ['9:45 AM', '10:30 AM', '11:15 AM', 'Yesterday', '2 days ago', 'Monday'][$index % 6];
                        
                        echo "<div class='chat-item $is_active' onclick=\"window.location.href='?chat_id=" . ($index + 1) . "&emp_id=" . htmlspecialchars($emp['employee_id']) . "'\">";
                        echo "<div class='avatar-wrapper'>";
                        echo "<div class='chat-avatar' style='background: $color'>$initials</div>";
                        if ($index % 3 === 0) echo "<div class='presence-indicator'></div>";
                        echo "</div>";
                        echo "<div class='chat-info'>";
                        echo "<div class='chat-name'>" . htmlspecialchars($emp['full_name']) . "</div>";
                        echo "<div class='chat-preview'>$preview</div>";
                        echo "</div>";
                        echo "<div class='chat-meta'>$time</div>";
                        echo "</div>";
                        
                        $index++;
                    }
                }
                ?>
            </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chat-main">
            <?php
            // Get selected employee info
            $selected_emp_id = $_GET['emp_id'] ?? null;
            $selected_emp_name = "Select a chat";
            $selected_emp_dept = "";
            $selected_emp_role = "";
            
            if ($selected_emp_id) {
                $emp_query = $conn->prepare("SELECT full_name, department, role FROM employees WHERE employee_id = ?");
                $emp_query->bind_param("s", $selected_emp_id);
                $emp_query->execute();
                $emp_result = $emp_query->get_result();
                if ($emp_data = $emp_result->fetch_assoc()) {
                    $selected_emp_name = $emp_data['full_name'];
                    $selected_emp_dept = $emp_data['department'];
                    $selected_emp_role = $emp_data['role'];
                }
            }
            ?>
            
            <div class="chat-header">
                <div style="flex: 1;">
                    <div class="chat-header-title"><?php echo htmlspecialchars($selected_emp_name); ?></div>
                    <?php if ($selected_emp_role): ?>
                        <div class="chat-header-subtitle"><?php echo htmlspecialchars($selected_emp_role) . " • " . htmlspecialchars($selected_emp_dept); ?></div>
                    <?php endif; ?>
                </div>
                <div class="chat-header-actions">
                    <button class="action-btn" title="Video call">📹</button>
                    <button class="action-btn" title="Audio call">📞</button>
                    <button class="action-btn" title="More options">⋯</button>
                </div>
            </div>

            <div class="chat-messages" id="messages">
                <?php if ($selected_emp_id): ?>
                    <!-- Sample Messages -->
                    <div class="message">
                        <div class="avatar-wrapper">
                            <div class="message-avatar" style="background: #6264a7"><?php echo strtoupper(substr($selected_emp_name, 0, 1)); ?></div>
                            <div class="presence-indicator"></div>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-author"><?php echo htmlspecialchars($selected_emp_name); ?></span>
                                <span class="message-time">9:45 AM</span>
                            </div>
                            <div class="message-text">Hey! I wanted to follow up on the quarterly review we discussed yesterday. Do you have time for a quick sync today?</div>
                            <div class="message-reactions">
                                <div class="reaction">👍 2</div>
                            </div>
                        </div>
                    </div>

                    <div class="message">
                        <div class="avatar-wrapper">
                            <div class="message-avatar" style="background: #0078d4"><?php echo strtoupper(substr($full_name, 0, 1)); ?></div>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-author">You</span>
                                <span class="message-time">9:47 AM</span>
                            </div>
                            <div class="message-text">Sure! I'm free after 2 PM. Should we do a Teams call or meet in person?</div>
                        </div>
                    </div>

                    <div class="message">
                        <div class="avatar-wrapper">
                            <div class="message-avatar" style="background: #6264a7"><?php echo strtoupper(substr($selected_emp_name, 0, 1)); ?></div>
                            <div class="presence-indicator"></div>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-author"><?php echo htmlspecialchars($selected_emp_name); ?></span>
                                <span class="message-time">9:50 AM</span>
                            </div>
                            <div class="message-text">Teams call works great! I'll send you a meeting invite for 2:30 PM. Thanks!</div>
                            <div class="message-reactions">
                                <div class="reaction">✅ 1</div>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <div style="text-align: center; color: #8a8886; margin-top: 100px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                        <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Select a conversation</div>
                        <div style="font-size: 14px;">Choose a chat from the list to start messaging</div>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ($selected_emp_id): ?>
            <div class="chat-composer">
                <div class="composer-box">
                    <textarea class="composer-input" placeholder="Type a message" rows="2" id="messageInput"></textarea>
                    <div class="composer-actions">
                        <div class="composer-tools">
                            <button class="tool-btn" title="Format">🎨</button>
                            <button class="tool-btn" title="Attach file">📎</button>
                            <button class="tool-btn" title="Emoji">😊</button>
                            <button class="tool-btn" title="GIF">GIF</button>
                        </div>
                        <button class="send-btn" onclick="sendMessage()">Send</button>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- Right Sidebar - Details -->
        <?php if ($selected_emp_id): ?>
        <div class="sidebar-right">
            <div class="details-header">
                <div class="avatar-wrapper" style="display: inline-block; position: relative;">
                    <div class="details-avatar"><?php echo strtoupper(substr($selected_emp_name, 0, 1)); ?></div>
                    <div class="presence-indicator" style="width: 16px; height: 16px; bottom: 8px; right: 8px;"></div>
                </div>
                <div class="details-name"><?php echo htmlspecialchars($selected_emp_name); ?></div>
                <div class="details-status">🟢 Available</div>
            </div>

            <div class="tabs">
                <div class="tab active">Profile</div>
                <div class="tab">Files</div>
            </div>

            <div class="details-section">
                <div class="details-section-title">Contact Information</div>
                <div class="detail-row">
                    <span class="detail-label">Employee ID</span>
                    <span class="detail-value"><?php echo htmlspecialchars($selected_emp_id); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Department</span>
                    <span class="detail-value"><?php echo htmlspecialchars($selected_emp_dept); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Role</span>
                    <span class="detail-value"><?php echo htmlspecialchars($selected_emp_role); ?></span>
                </div>
            </div>

            <div class="details-section">
                <div class="details-section-title">Quick Actions</div>
                <div class="detail-row" style="cursor: pointer; color: #6264a7;">
                    <span>📧 Send email</span>
                </div>
                <div class="detail-row" style="cursor: pointer; color: #6264a7;">
                    <span>📅 Schedule meeting</span>
                </div>
                <div class="detail-row" style="cursor: pointer; color: #6264a7;">
                    <span>👁️ View full profile</span>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <script>
        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (input.value.trim()) {
                alert('Message sending functionality will be implemented with the API');
                input.value = '';
            }
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const chatItems = document.querySelectorAll('.chat-item');
            
            chatItems.forEach(item => {
                const name = item.querySelector('.chat-name').textContent.toLowerCase();
                item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
            });
        });

        // Auto-scroll to bottom of messages
        const messagesDiv = document.getElementById('messages');
        if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    </script>
</body>
</html>
