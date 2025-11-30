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

// Get current page
$page = $_GET['page'] ?? 'dashboard';

// Fetch statistics
$total_employees_query = "SELECT COUNT(*) as total FROM employees";
$total_employees = $conn->query($total_employees_query)->fetch_assoc()['total'];

$departments_query = "SELECT department, COUNT(*) as count FROM employees GROUP BY department";
$departments_result = $conn->query($departments_query);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <link rel="apple-touch-icon" sizes="76x76" href="assets/img/apple-icon.png">
    <link rel="icon" type="image/png" href="../images/mercedes-logo.png">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <title>MBTI Portal - Paper Dashboard</title>
    <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no' name='viewport' />
    
    <!-- CSS Files -->
    <link href="assets/css/paper-dashboard.css" rel="stylesheet" />
    <link href="assets/css/demo.css" rel="stylesheet" />
    
    <!-- Fonts and icons -->
    <link href="https://fonts.googleapis.com/css?family=Montserrat:400,700,200" rel="stylesheet" />
    <link href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css" rel="stylesheet">
    
    <style>
        .sidebar[data-color="white"] .logo {
            border-bottom: 1px solid #ddd;
            padding: 15px 15px;
        }
        .logo-text {
            font-weight: 700;
            font-size: 18px;
            color: #66615B;
            margin-left: 10px;
        }
        .sidebar .nav li.active > a {
            background: rgba(81, 203, 206, 0.1);
            color: #51cbce;
        }
        .card-stats .icon-big {
            font-size: 3em;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <!-- Sidebar -->
        <div class="sidebar" data-color="white" data-active-color="danger">
            <div class="logo">
                <a href="?page=dashboard" class="simple-text logo-mini">
                    <div class="logo-image-small">
                        <img src="../images/mercedes-logo.png" style="width: 30px;">
                    </div>
                </a>
                <a href="?page=dashboard" class="simple-text logo-normal">
                    <span class="logo-text">MBTI Portal</span>
                </a>
            </div>
            
            <div class="sidebar-wrapper">
                <ul class="nav">
                    <li class="<?php echo $page === 'dashboard' ? 'active' : ''; ?>">
                        <a href="?page=dashboard">
                            <i class="nc-icon nc-bank"></i>
                            <p>Dashboard</p>
                        </a>
                    </li>
                    <li class="<?php echo $page === 'teams' ? 'active' : ''; ?>">
                        <a href="?page=teams">
                            <i class="nc-icon nc-single-02"></i>
                            <p>Teams</p>
                        </a>
                    </li>
                    <li class="<?php echo $page === 'projects' ? 'active' : ''; ?>">
                        <a href="?page=projects">
                            <i class="nc-icon nc-tile-56"></i>
                            <p>Projects</p>
                        </a>
                    </li>
                    <li class="<?php echo $page === 'reports' ? 'active' : ''; ?>">
                        <a href="?page=reports">
                            <i class="nc-icon nc-chart-bar-32"></i>
                            <p>Reports</p>
                        </a>
                    </li>
                    <li class="<?php echo $page === 'profile' ? 'active' : ''; ?>">
                        <a href="?page=profile">
                            <i class="nc-icon nc-circle-10"></i>
                            <p>Profile</p>
                        </a>
                    </li>
                    <li>
                        <a href="logout.php">
                            <i class="nc-icon nc-button-power"></i>
                            <p>Logout</p>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Main Panel -->
        <div class="main-panel">
            <!-- Navbar -->
            <nav class="navbar navbar-expand-lg navbar-absolute fixed-top navbar-transparent">
                <div class="container-fluid">
                    <div class="navbar-wrapper">
                        <div class="navbar-toggle">
                            <button type="button" class="navbar-toggler">
                                <span class="navbar-toggler-bar bar1"></span>
                                <span class="navbar-toggler-bar bar2"></span>
                                <span class="navbar-toggler-bar bar3"></span>
                            </button>
                        </div>
                        <a class="navbar-brand" href="#"><strong><?php echo ucfirst($page); ?></strong></a>
                    </div>
                    <div class="collapse navbar-collapse justify-content-end">
                        <ul class="navbar-nav">
                            <li class="nav-item">
                                <a class="nav-link btn-magnify" href="#">
                                    <i class="nc-icon nc-layout-11"></i>
                                    <p><span class="d-lg-none d-md-block">Stats</span></p>
                                </a>
                            </li>
                            <li class="nav-item btn-rotate dropdown">
                                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" data-toggle="dropdown">
                                    <i class="nc-icon nc-bell-55"></i>
                                    <p><span class="d-lg-none d-md-block">Notifications</span></p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link btn-rotate" href="?page=profile">
                                    <i class="nc-icon nc-single-02"></i>
                                    <p><span class="d-lg-none d-md-block"><?php echo htmlspecialchars($full_name); ?></span></p>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <!-- Page Content -->
            <div class="content">
                <?php
                switch($page) {
                    case 'dashboard':
                        include 'pages/dashboard_content.php';
                        break;
                    case 'teams':
                        include 'pages/teams_content.php';
                        break;
                    case 'projects':
                        include 'pages/projects_content.php';
                        break;
                    case 'reports':
                        include 'pages/reports_content.php';
                        break;
                    case 'profile':
                        include 'pages/profile_content.php';
                        break;
                    default:
                        include 'pages/dashboard_content.php';
                }
                ?>
            </div>

            <!-- Footer -->
            <footer class="footer footer-black footer-white">
                <div class="container-fluid">
                    <div class="row">
                        <nav class="footer-nav">
                            <ul>
                                <li><a href="?page=dashboard">MBTI Portal</a></li>
                                <li><a href="?page=teams">Teams</a></li>
                                <li><a href="?page=projects">Projects</a></li>
                            </ul>
                        </nav>
                        <div class="credits ml-auto">
                            <span class="copyright">
                                © <?php echo date('Y'); ?>, Mercedes-Benz Tech Innovation
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </div>

    <!-- Core JS Files -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/perfect-scrollbar/1.5.0/perfect-scrollbar.min.js"></script>
    
    <script>
        $(document).ready(function() {
            // Perfect Scrollbar
            if ($('.sidebar-wrapper').length != 0) {
                var ps = new PerfectScrollbar('.sidebar-wrapper');
            }
        });
    </script>
</body>
</html>
