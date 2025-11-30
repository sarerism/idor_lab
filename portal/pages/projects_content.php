<?php
// Sample projects data - in a real application, this would come from a database
$projects = [
    [
        'id' => 1,
        'name' => 'Digital Transformation Initiative',
        'description' => 'Modernizing legacy systems and infrastructure',
        'department' => 'IT',
        'progress' => 75,
        'status' => 'In Progress',
        'team_size' => 12,
        'deadline' => '2024-06-30'
    ],
    [
        'id' => 2,
        'name' => 'Customer Portal Enhancement',
        'description' => 'Improving user experience and adding new features',
        'department' => 'Engineering',
        'progress' => 60,
        'status' => 'In Progress',
        'team_size' => 8,
        'deadline' => '2024-05-15'
    ],
    [
        'id' => 3,
        'name' => 'Cloud Migration',
        'description' => 'Moving infrastructure to Azure cloud platform',
        'department' => 'IT',
        'progress' => 45,
        'status' => 'In Progress',
        'team_size' => 15,
        'deadline' => '2024-08-31'
    ],
    [
        'id' => 4,
        'name' => 'Mobile App Development',
        'description' => 'Building cross-platform mobile application',
        'department' => 'Engineering',
        'progress' => 90,
        'status' => 'Near Completion',
        'team_size' => 6,
        'deadline' => '2024-04-15'
    ],
    [
        'id' => 5,
        'name' => 'HR Management System',
        'description' => 'Implementing new HRMS solution',
        'department' => 'HR',
        'progress' => 30,
        'status' => 'Planning',
        'team_size' => 5,
        'deadline' => '2024-09-30'
    ],
    [
        'id' => 6,
        'name' => 'Data Analytics Platform',
        'description' => 'Building centralized analytics and reporting',
        'department' => 'Data Science',
        'progress' => 55,
        'status' => 'In Progress',
        'team_size' => 10,
        'deadline' => '2024-07-31'
    ],
];

function getProgressColor($progress) {
    if ($progress >= 80) return 'success';
    if ($progress >= 50) return 'primary';
    if ($progress >= 30) return 'warning';
    return 'danger';
}

function getStatusBadge($status) {
    $badges = [
        'In Progress' => 'primary',
        'Near Completion' => 'success',
        'Planning' => 'warning',
        'On Hold' => 'danger'
    ];
    return $badges[$status] ?? 'secondary';
}
?>

<div class="row">
    <div class="col-lg-3 col-md-6">
        <div class="card card-stats">
            <div class="card-body">
                <div class="row">
                    <div class="col-5">
                        <div class="icon-big text-center">
                            <i class="nc-icon nc-tile-56 text-primary"></i>
                        </div>
                    </div>
                    <div class="col-7">
                        <div class="numbers">
                            <p class="card-category">Total Projects</p>
                            <p class="card-title"><?php echo count($projects); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="stats">
                    <i class="fa fa-refresh"></i> Active
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-3 col-md-6">
        <div class="card card-stats">
            <div class="card-body">
                <div class="row">
                    <div class="col-5">
                        <div class="icon-big text-center">
                            <i class="nc-icon nc-chart-pie-36 text-success"></i>
                        </div>
                    </div>
                    <div class="col-7">
                        <div class="numbers">
                            <p class="card-category">In Progress</p>
                            <p class="card-title">4</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="stats">
                    <i class="fa fa-clock-o"></i> Ongoing
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-3 col-md-6">
        <div class="card card-stats">
            <div class="card-body">
                <div class="row">
                    <div class="col-5">
                        <div class="icon-big text-center">
                            <i class="nc-icon nc-check-2 text-warning"></i>
                        </div>
                    </div>
                    <div class="col-7">
                        <div class="numbers">
                            <p class="card-category">Completion</p>
                            <p class="card-title">59%</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="stats">
                    <i class="fa fa-calendar-o"></i> Average
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-lg-3 col-md-6">
        <div class="card card-stats">
            <div class="card-body">
                <div class="row">
                    <div class="col-5">
                        <div class="icon-big text-center">
                            <i class="nc-icon nc-single-02 text-danger"></i>
                        </div>
                    </div>
                    <div class="col-7">
                        <div class="numbers">
                            <p class="card-category">Team Members</p>
                            <p class="card-title">56</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="stats">
                    <i class="fa fa-users"></i> Total
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <?php foreach ($projects as $project): ?>
    <div class="col-md-6">
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0"><?php echo htmlspecialchars($project['name']); ?></h5>
                    <span class="badge badge-<?php echo getStatusBadge($project['status']); ?>">
                        <?php echo $project['status']; ?>
                    </span>
                </div>
                <p class="card-category"><?php echo htmlspecialchars($project['department']); ?> Department</p>
            </div>
            <div class="card-body">
                <p><?php echo htmlspecialchars($project['description']); ?></p>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small><strong>Progress</strong></small>
                        <small><strong><?php echo $project['progress']; ?>%</strong></small>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-<?php echo getProgressColor($project['progress']); ?>" 
                             role="progressbar" 
                             style="width: <?php echo $project['progress']; ?>%">
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-6">
                        <small class="text-muted">
                            <i class="nc-icon nc-single-02"></i> 
                            <strong><?php echo $project['team_size']; ?></strong> members
                        </small>
                    </div>
                    <div class="col-6 text-right">
                        <small class="text-muted">
                            <i class="nc-icon nc-calendar-60"></i> 
                            Due: <strong><?php echo date('M d, Y', strtotime($project['deadline'])); ?></strong>
                        </small>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <hr>
                <div class="button-container">
                    <button class="btn btn-link btn-sm">
                        <i class="nc-icon nc-zoom-split"></i> View Details
                    </button>
                    <button class="btn btn-link btn-sm">
                        <i class="nc-icon nc-settings-gear-65"></i> Manage
                    </button>
                </div>
            </div>
        </div>
    </div>
    <?php endforeach; ?>
</div>
