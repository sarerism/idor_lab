<?php
// Fetch current user's data
$user_query = "SELECT * FROM employees WHERE employee_id = ?";
$stmt = $conn->prepare($user_query);
$stmt->bind_param("s", $employee_id);
$stmt->execute();
$user_data = $stmt->get_result()->fetch_assoc();

// Get manager info if exists
$manager_info = null;
if (!empty($user_data['manager_name'])) {
    $manager_query = "SELECT * FROM employees WHERE full_name = ? LIMIT 1";
    $stmt = $conn->prepare($manager_query);
    $stmt->bind_param("s", $user_data['manager_name']);
    $stmt->execute();
    $manager_info = $stmt->get_result()->fetch_assoc();
}
?>

<div class="row">
    <div class="col-md-4">
        <div class="card card-user">
            <div class="image">
                <img src="../assets/img/damir-bosnjak.jpg" alt="Background" style="height: 150px; object-fit: cover;">
            </div>
            <div class="card-body">
                <div class="author">
                    <div class="avatar border-gray" style="width: 100px; height: 100px; margin: -50px auto 20px; background: linear-gradient(135deg, #51cbce 0%, #6bd098 100%); display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 3rem; color: white; font-weight: bold;">
                        <?php echo strtoupper(substr($user_data['full_name'], 0, 1)); ?>
                    </div>
                    <h5 class="title"><?php echo htmlspecialchars($user_data['full_name']); ?></h5>
                    <p class="description">
                        <?php echo htmlspecialchars($user_data['role']); ?>
                    </p>
                </div>
                <p class="description text-center">
                    <?php echo htmlspecialchars($user_data['department']); ?> Department<br>
                    Employee ID: <strong><?php echo htmlspecialchars($user_data['employee_id']); ?></strong>
                </p>
            </div>
            <div class="card-footer">
                <hr>
                <div class="button-container">
                    <div class="row">
                        <div class="col-4">
                            <h5>12
                                <br>
                                <small>Projects</small>
                            </h5>
                        </div>
                        <div class="col-4">
                            <h5>89%
                                <br>
                                <small>Performance</small>
                            </h5>
                        </div>
                        <div class="col-4">
                            <h5>4.8
                                <br>
                                <small>Rating</small>
                            </h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <?php if ($manager_info): ?>
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Manager</h5>
            </div>
            <div class="card-body">
                <ul class="list-unstyled team-members">
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar" style="background-color: #ef8157; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    <?php echo strtoupper(substr($manager_info['full_name'], 0, 1)); ?>
                                </div>
                            </div>
                            <div class="col-10">
                                <?php echo htmlspecialchars($manager_info['full_name']); ?>
                                <br />
                                <span class="text-muted">
                                    <small><?php echo htmlspecialchars($manager_info['role']); ?></small>
                                </span>
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="text-center">
                    <button class="btn btn-sm btn-outline-primary btn-round">
                        <i class="nc-icon nc-email-85"></i> Contact Manager
                    </button>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
    
    <div class="col-md-8">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Edit Profile</h5>
            </div>
            <div class="card-body">
                <form>
                    <div class="row">
                        <div class="col-md-6 pr-1">
                            <div class="form-group">
                                <label>Employee ID (readonly)</label>
                                <input type="text" class="form-control" readonly value="<?php echo htmlspecialchars($user_data['employee_id']); ?>">
                            </div>
                        </div>
                        <div class="col-md-6 pl-1">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-control" value="<?php echo htmlspecialchars($user_data['email']); ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                <label>Full Name</label>
                                <input type="text" class="form-control" value="<?php echo htmlspecialchars($user_data['full_name']); ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 pr-1">
                            <div class="form-group">
                                <label>Department (readonly)</label>
                                <input type="text" class="form-control" readonly value="<?php echo htmlspecialchars($user_data['department']); ?>">
                            </div>
                        </div>
                        <div class="col-md-6 pl-1">
                            <div class="form-group">
                                <label>Role (readonly)</label>
                                <input type="text" class="form-control" readonly value="<?php echo htmlspecialchars($user_data['role']); ?>">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 pr-1">
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="text" class="form-control" placeholder="+49 123 456 7890">
                            </div>
                        </div>
                        <div class="col-md-6 pl-1">
                            <div class="form-group">
                                <label>Office Location</label>
                                <input type="text" class="form-control" placeholder="Stuttgart, Germany">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="update ml-auto mr-auto">
                            <button type="submit" class="btn btn-primary btn-round">Update Profile</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Recent Activity</h5>
            </div>
            <div class="card-body">
                <ul class="list-unstyled team-members">
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar">
                                    <i class="nc-icon nc-check-2 text-success"></i>
                                </div>
                            </div>
                            <div class="col-7">
                                Completed project milestone
                                <br />
                                <span class="text-muted">
                                    <small>2 hours ago</small>
                                </span>
                            </div>
                            <div class="col-3 text-right">
                                <span class="badge badge-success">DONE</span>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar">
                                    <i class="nc-icon nc-email-85 text-primary"></i>
                                </div>
                            </div>
                            <div class="col-7">
                                Sent team update
                                <br />
                                <span class="text-muted">
                                    <small>5 hours ago</small>
                                </span>
                            </div>
                            <div class="col-3 text-right">
                                <span class="badge badge-primary">SENT</span>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar">
                                    <i class="nc-icon nc-paper text-warning"></i>
                                </div>
                            </div>
                            <div class="col-7">
                                Submitted report
                                <br />
                                <span class="text-muted">
                                    <small>1 day ago</small>
                                </span>
                            </div>
                            <div class="col-3 text-right">
                                <span class="badge badge-warning">REPORT</span>
                            </div>
                        </div>
                    </li>
                    <li>
                        <div class="row">
                            <div class="col-2">
                                <div class="avatar">
                                    <i class="nc-icon nc-settings-gear-65 text-info"></i>
                                </div>
                            </div>
                            <div class="col-7">
                                Updated profile settings
                                <br />
                                <span class="text-muted">
                                    <small>2 days ago</small>
                                </span>
                            </div>
                            <div class="col-3 text-right">
                                <span class="badge badge-info">UPDATE</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
