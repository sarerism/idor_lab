import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Table,
    Row,
    Col,
    Button,
    Badge,
} from "reactstrap";

function Reports() {
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const reportId = searchParams.get("report_id");

    useEffect(() => {
        if (!reportId) {
            // Redirect to most recent report (502) when no report_id specified
            navigate("/reports?report_id=502", { replace: true });
            return;
        }
        fetchReportById(parseInt(reportId));
    }, [reportId, navigate]);



    const fetchReportById = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/reports.php?id=${id}`);
            const data = await response.json();
            if (data.success) {
                setSelectedReport(data.data);
            } else {
                setSelectedReport(null);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            setSelectedReport(null);
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="content">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    // Show individual report view
    if (reportId && selectedReport) {
        return (
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <Row>
                                    <Col md="6">
                                        <CardTitle tag="h4">
                                            Report #{selectedReport.id}
                                            {selectedReport.is_confidential && (
                                                <Badge color="danger" className="ml-2">
                                                    CONFIDENTIAL
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <p className="card-category">{selectedReport.report_title}</p>
                                    </Col>
                                </Row>
                            </CardHeader>
                            <CardBody>
                                <Row className="mb-3">
                                    <Col md="6">
                                        <p className="mb-2">
                                            <strong>Employee:</strong> {selectedReport.employee_name}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Employee ID:</strong> {selectedReport.employee_id}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Department:</strong>{" "}
                                            {selectedReport.employee_id === "MBTI2024837"
                                                ? "EPA"
                                                : selectedReport.employee_id === "MBTI2024999"
                                                    ? "Management"
                                                    : "Various"}
                                        </p>
                                    </Col>
                                    <Col md="6">
                                        <p className="mb-2">
                                            <strong>Submitted:</strong>{" "}
                                            {new Date(selectedReport.submitted_at).toLocaleString()}
                                        </p>
                                        <p className="mb-2">
                                            <strong>Status:</strong>{" "}
                                            <Badge
                                                color={
                                                    selectedReport.status === "approved" ? "success" : "warning"
                                                }
                                            >
                                                {selectedReport.status}
                                            </Badge>
                                        </p>
                                    </Col>
                                </Row>

                                <Card className="mb-3">
                                    <CardBody
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            maxHeight: "500px",
                                            overflowY: "auto",
                                            whiteSpace: "pre-wrap",
                                            fontFamily: "monospace",
                                            fontSize: "13px",
                                            lineHeight: "1.6",
                                        }}
                                    >
                                        {selectedReport.report_content}
                                    </CardBody>
                                </Card>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // Show report not found
    if (reportId && !selectedReport) {
        return (
            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardBody className="text-center">
                                <h4>Report Not Found</h4>
                                <p className="text-muted">Report #{reportId} does not exist.</p>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }

    // Fallback - should never reach here due to redirect
    return null;
}

export default Reports;
