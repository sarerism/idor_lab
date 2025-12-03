import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Progress,
    Badge,
    Alert,
} from "reactstrap";

function Projects() {
    const [searchParams] = useSearchParams();
    const [accessDenied, setAccessDenied] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const uid = searchParams.get("uid");

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setLoggedInUser(parsedUser);

            // Check if the uid in URL matches the logged-in user
            if (uid && uid !== parsedUser.employee_id) {
                setAccessDenied(true);
            } else {
                setAccessDenied(false);
            }
        }
    }, [uid]);
    const projects = [
        {
            id: 1,
            name: "Security Code Review Automation",
            description: "Implementing SAST/DAST tools for continuous security testing",
            department: "CIVA-I",
            progress: 65,
            status: "In Progress",
            team_size: 4,
            deadline: "2024-06-30",
        },
        {
            id: 2,
            name: "Vulnerability Management Program",
            description: "Establishing enterprise-wide vulnerability assessment and remediation",
            department: "CIVA-I",
            progress: 45,
            status: "In Progress",
            team_size: 6,
            deadline: "2024-08-15",
        },
        {
            id: 3,
            name: "Zero Trust Architecture Implementation",
            description: "Deploying zero-trust security model across infrastructure",
            department: "CIVA-I",
            progress: 30,
            status: "Planning",
            team_size: 8,
            deadline: "2024-12-31",
        },
        {
            id: 4,
            name: "Security Awareness Training Platform",
            description: "Building internal phishing simulation and training system",
            department: "CIVA-I",
            progress: 80,
            status: "Near Completion",
            team_size: 3,
            deadline: "2024-05-15",
        },
        {
            id: 5,
            name: "Incident Response Playbook Development",
            description: "Creating standardized security incident response procedures",
            department: "CIVA-I",
            progress: 55,
            status: "In Progress",
            team_size: 5,
            deadline: "2024-07-30",
        },
        {
            id: 6,
            name: "Cloud Security Posture Management",
            description: "Implementing CSPM tools for Azure infrastructure monitoring",
            department: "CIVA-I",
            progress: 40,
            status: "In Progress",
            team_size: 4,
            deadline: "2024-09-30",
        },
    ];

    if (accessDenied) {
        return (
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardBody>
                                <Alert color="danger">
                                    <h4 className="alert-heading">Access Denied</h4>
                                    <p>
                                        You don't have permission to view this page. You are trying to access data for user ID: <strong>{uid}</strong>
                                    </p>
                                    <p>
                                        Your user ID is: <strong>{loggedInUser?.employee_id}</strong>
                                    </p>
                                    <hr />
                                    <p className="mb-0">
                                        Please use the navigation menu to access your own data.
                                    </p>
                                </Alert>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

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
