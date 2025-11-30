<?php
// Get department statistics
$dept_stats_query = "SELECT 
    department, 
    COUNT(*) as employee_count,
    COUNT(DISTINCT role) as role_count
FROM employees 
WHERE department != '' 
GROUP BY department 
ORDER BY employee_count DESC";
$dept_stats = $conn->query($dept_stats_query);

// Get role distribution
$role_stats_query = "SELECT 
    role, 
    COUNT(*) as count 
FROM employees 
WHERE role != '' 
GROUP BY role 
ORDER BY count DESC 
LIMIT 10";
$role_stats = $conn->query($role_stats_query);

// Calculate totals
$total_employees = $conn->query("SELECT COUNT(*) as total FROM employees")->fetch_assoc()['total'];
$total_departments = $conn->query("SELECT COUNT(DISTINCT department) as total FROM employees WHERE department != ''")->fetch_assoc()['total'];
?>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Employee Distribution Report</h4>
                <p class="card-category">Overview of organizational structure</p>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center">
                            <h2 class="text-primary"><?php echo $total_employees; ?></h2>
                            <p class="text-muted">Total Employees</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h2 class="text-success"><?php echo $total_departments; ?></h2>
                            <p class="text-muted">Departments</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h2 class="text-warning">12</h2>
                            <p class="text-muted">Active Projects</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h2 class="text-danger">98%</h2>
                            <p class="text-muted">Satisfaction Rate</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Department Statistics</h5>
                <p class="card-category">Employee count and diversity by department</p>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="text-primary">
                            <tr>
                                <th>Department</th>
                                <th class="text-center">Employees</th>
                                <th class="text-center">Roles</th>
                                <th class="text-right">% of Total</th>
                                <th class="text-right">Growth</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $dept_stats->data_seek(0);
                            while ($dept = $dept_stats->fetch_assoc()): 
                                $percentage = round(($dept['employee_count'] / $total_employees) * 100, 1);
                                $growth = rand(-5, 15); // Simulated growth
                                $growth_class = $growth >= 0 ? 'text-success' : 'text-danger';
                                $growth_icon = $growth >= 0 ? 'nc-simple-add' : 'nc-simple-delete';
                            ?>
                            <tr>
                                <td><strong><?php echo htmlspecialchars($dept['department']); ?></strong></td>
                                <td class="text-center">
                                    <span class="badge badge-primary"><?php echo $dept['employee_count']; ?></span>
                                </td>
                                <td class="text-center"><?php echo $dept['role_count']; ?></td>
                                <td class="text-right"><?php echo $percentage; ?>%</td>
                                <td class="text-right <?php echo $growth_class; ?>">
                                    <i class="nc-icon <?php echo $growth_icon; ?>"></i>
                                    <?php echo abs($growth); ?>%
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-4">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Top Roles</h5>
                <p class="card-category">Most common positions</p>
            </div>
            <div class="card-body">
                <ul class="list-unstyled team-members">
                    <?php 
                    $colors = ['primary', 'success', 'warning', 'danger', 'info'];
                    $index = 0;
                    while ($role = $role_stats->fetch_assoc()): 
                        $color = $colors[$index % count($colors)];
                    ?>
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar">
                                    <span class="badge badge-<?php echo $color; ?> badge-pill">
                                        <?php echo $role['count']; ?>
                                    </span>
                                </div>
                            </div>
                            <div class="col-10">
                                <?php echo htmlspecialchars($role['role']); ?>
                                <br />
                                <span class="text-muted">
                                    <small>
                                        <?php echo round(($role['count'] / $total_employees) * 100, 1); ?>% of workforce
                                    </small>
                                </span>
                            </div>
                        </div>
                    </li>
                    <?php 
                    $index++;
                    endwhile; 
                    ?>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Department Breakdown</h5>
                <p class="card-category">Visual representation of employee distribution</p>
            </div>
            <div class="card-body">
                <div class="row">
                    <?php
                    $dept_stats->data_seek(0);
                    $chart_colors = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'];
                    $color_index = 0;
                    
                    while ($dept = $dept_stats->fetch_assoc()):
                        $percentage = round(($dept['employee_count'] / $total_employees) * 100, 1);
                        $color = $chart_colors[$color_index % count($chart_colors)];
                    ?>
                    <div class="col-md-4 mb-4">
                        <div class="text-center">
                            <div style="font-size: 3rem; color: var(--<?php echo $color; ?>);">
                                <i class="nc-icon nc-briefcase-24"></i>
                            </div>
                            <h4><?php echo htmlspecialchars($dept['department']); ?></h4>
                            <div class="progress mb-2" style="height: 10px;">
                                <div class="progress-bar bg-<?php echo $color; ?>" 
                                     style="width: <?php echo $percentage; ?>%">
                                </div>
                            </div>
                            <p class="text-muted">
                                <strong><?php echo $dept['employee_count']; ?></strong> employees (<?php echo $percentage; ?>%)
                            </p>
                        </div>
                    </div>
                    <?php 
                    $color_index++;
                    endwhile; 
                    ?>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Export Reports</h5>
                <p class="card-category">Generate and download reports</p>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <button class="btn btn-primary btn-block">
                            <i class="nc-icon nc-cloud-download-93"></i> Department Report
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-success btn-block">
                            <i class="nc-icon nc-cloud-download-93"></i> Employee List
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-warning btn-block">
                            <i class="nc-icon nc-cloud-download-93"></i> Role Distribution
                        </button>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-danger btn-block">
                            <i class="nc-icon nc-cloud-download-93"></i> Full Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
