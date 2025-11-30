<?php
// Fetch all employees
$employees_query = "SELECT * FROM employees ORDER BY department, full_name";
$employees_result = $conn->query($employees_query);
?>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header">
                <h4 class="card-title">Team Members</h4>
                <p class="card-category">All employees in the organization</p>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead class="text-primary">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Manager</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while ($employee = $employees_result->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($employee['employee_id']); ?></td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar mr-2" style="background-color: #51cbce; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                            <?php echo strtoupper(substr($employee['full_name'], 0, 1)); ?>
                                        </div>
                                        <?php echo htmlspecialchars($employee['full_name']); ?>
                                    </div>
                                </td>
                                <td><?php echo htmlspecialchars($employee['email']); ?></td>
                                <td>
                                    <span class="badge badge-info">
                                        <?php echo htmlspecialchars($employee['department']); ?>
                                    </span>
                                </td>
                                <td><?php echo htmlspecialchars($employee['role']); ?></td>
                                <td><?php echo htmlspecialchars($employee['manager_name'] ?? 'N/A'); ?></td>
                                <td class="text-right">
                                    <button class="btn btn-link btn-sm" title="View Details">
                                        <i class="nc-icon nc-zoom-split"></i>
                                    </button>
                                    <button class="btn btn-link btn-sm" title="Contact">
                                        <i class="nc-icon nc-email-85"></i>
                                    </button>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <?php
    // Get department counts for cards
    $dept_query = "SELECT department, COUNT(*) as count FROM employees WHERE department != '' GROUP BY department ORDER BY count DESC LIMIT 4";
    $dept_result = $conn->query($dept_query);
    
    $colors = ['primary', 'success', 'warning', 'danger'];
    $icons = ['nc-briefcase-24', 'nc-settings-gear-65', 'nc-vector', 'nc-box-2'];
    $index = 0;
    
    while ($dept = $dept_result->fetch_assoc()):
    ?>
    <div class="col-lg-3 col-md-6">
        <div class="card card-stats">
            <div class="card-body">
                <div class="row">
                    <div class="col-5">
                        <div class="icon-big text-center icon-<?php echo $colors[$index]; ?>">
                            <i class="nc-icon <?php echo $icons[$index]; ?> text-<?php echo $colors[$index]; ?>"></i>
                        </div>
                    </div>
                    <div class="col-7">
                        <div class="numbers">
                            <p class="card-category"><?php echo htmlspecialchars($dept['department']); ?></p>
                            <p class="card-title"><?php echo $dept['count']; ?>
                                <br><small>members</small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="stats">
                    <i class="fa fa-users"></i> Team Size
                </div>
            </div>
        </div>
    </div>
    <?php 
    $index++;
    endwhile; 
    ?>
</div>
