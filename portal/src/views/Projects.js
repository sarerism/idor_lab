import React from "react";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Progress,
    Badge,
} from "reactstrap";

function Projects() {
    const projects = [
        {
            id: 1,
            name: "Digital Transformation Initiative",
            description: "Modernizing legacy systems and infrastructure",
            department: "IT",
            progress: 75,
            status: "In Progress",
            team_size: 12,
            deadline: "2024-06-30",
        },
        {
            id: 2,
            name: "Customer Portal Enhancement",
            description: "Improving user experience and adding new features",
            department: "Engineering",
            progress: 60,
            status: "In Progress",
            team_size: 8,
            deadline: "2024-05-15",
        },
        {
            id: 3,
            name: "Cloud Migration",
            description: "Moving infrastructure to Azure cloud platform",
            department: "IT",
            progress: 45,
            status: "In Progress",
            team_size: 15,
            deadline: "2024-08-31",
        },
        {
            id: 4,
            name: "Mobile App Development",
            description: "Building cross-platform mobile application",
            department: "Engineering",
            progress: 90,
            status: "Near Completion",
            team_size: 6,
            deadline: "2024-04-15",
        },
        {
            id: 5,
            name: "HR Management System",
            description: "Implementing new HRMS solution",
            department: "HR",
            progress: 30,
            status: "Planning",
            team_size: 5,
            deadline: "2024-09-30",
        },
        {
            id: 6,
            name: "Data Analytics Platform",
            description: "Building centralized analytics and reporting",
            department: "Data Science",
            progress: 55,
            status: "In Progress",
            team_size: 10,
            deadline: "2024-07-31",
        },
    ];

    const getProgressColor = (progress) => {
        if (progress >= 80) return "success";
        if (progress >= 50) return "primary";
        if (progress >= 30) return "warning";
        return "danger";
    };

    const getStatusBadge = (status) => {
        const badges = {
            "In Progress": "primary",
            "Near Completion": "success",
            Planning: "warning",
            "On Hold": "danger",
        };
        return badges[status] || "secondary";
    };

    return (
        <>
            <div className="content">
                <Row>
                    {projects.map((project) => (
                        <Col md="6" key={project.id}>
                            <Card>
                                <CardHeader>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <CardTitle tag="h5">{project.name}</CardTitle>
                                        <Badge color={getStatusBadge(project.status)}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <p className="card-category">{project.department} Department</p>
                                </CardHeader>
                                <CardBody>
                                    <p>{project.description}</p>
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-1">
                                            <small>
                                                <strong>Progress</strong>
                                            </small>
                                            <small>
                                                <strong>{project.progress}%</strong>
                                            </small>
                                        </div>
                                        <Progress
                                            value={project.progress}
                                            color={getProgressColor(project.progress)}
                                        />
                                    </div>
                                    <Row>
                                        <Col xs="6">
                                            <small className="text-muted">
                                                <i className="nc-icon nc-single-02"></i>{" "}
                                                <strong>{project.team_size}</strong> members
                                            </small>
                                        </Col>
                                        <Col xs="6" className="text-right">
                                            <small className="text-muted">
                                                <i className="nc-icon nc-calendar-60"></i> Due:{" "}
                                                <strong>
                                                    {new Date(project.deadline).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </strong>
                                            </small>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </>
    );
}

export default Projects;
