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
    Alert,
    Input,
    Form,
    FormGroup,
    Label,
} from "reactstrap";

function Reports() {
    const [searchParams] = useSearchParams();
    const [accessDenied, setAccessDenied] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const uid = searchParams.get("uid");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [reportTitle, setReportTitle] = useState("");

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (file.type !== 'application/pdf') {
                setUploadStatus({ type: 'danger', message: 'Please select a PDF file' });
                setSelectedFile(null);
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadStatus({ type: 'danger', message: 'File size must be less than 10MB' });
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setUploadStatus(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile || !reportTitle.trim()) {
            setUploadStatus({ type: 'warning', message: 'Please provide both report title and PDF file' });
            return;
        }

        const formData = new FormData();
        formData.append('pdf', selectedFile);
        formData.append('title', reportTitle);
        formData.append('employee_id', loggedInUser.employee_id);

        try {
            setUploadProgress(25);
            const response = await fetch('/api/upload_report.php', {
                method: 'POST',
                body: formData,
                credentials: 'include', // Include session cookie
            });

            setUploadProgress(75);
            const data = await response.json();
            setUploadProgress(100);

            if (data.success) {
                const viewUrl = `/api/view_report.php?file_id=${data.file_id.replace('uploads/', '')}`;
                setUploadStatus({
                    type: 'success',
                    message: (
                        <>
                            {data.message}
                            <br />
                            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="text-white" style={{ textDecoration: 'underline' }}>
                                View uploaded report
                            </a>
                        </>
                    )
                });
                setSelectedFile(null);
                setReportTitle('');
                // Reset file input
                document.getElementById('pdf-upload').value = '';
                setTimeout(() => setUploadProgress(0), 2000);
            } else {
                setUploadStatus({ type: 'danger', message: data.message || 'Upload failed' });
                setUploadProgress(0);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus({ type: 'danger', message: 'Network error during upload' });
            setUploadProgress(0);
        }
    };

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

    // Show report upload interface
    return (
        <div className="content">
            <Row>
                <Col md="12">
                    <Card>
                        <CardHeader>
                            <CardTitle tag="h4">
                                <i className="nc-icon nc-paper"></i> Weekly Reports
                            </CardTitle>
                            <p className="card-category">Upload your weekly report as PDF</p>
                        </CardHeader>
                        <CardBody>
                            {uploadStatus && (
                                <Alert color={uploadStatus.type} className="mb-4">
                                    {uploadStatus.message}
                                </Alert>
                            )}

                            <Form onSubmit={handleUpload}>
                                <FormGroup>
                                    <Label for="report-title">Report Title *</Label>
                                    <Input
                                        type="text"
                                        id="report-title"
                                        placeholder="e.g., Weekly Report - December 2024"
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label for="pdf-upload">Upload PDF Report *</Label>
                                    <Input
                                        type="file"
                                        id="pdf-upload"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                        required
                                    />
                                    <small className="text-muted">
                                        Maximum file size: 10MB. Only PDF files are allowed.
                                    </small>
                                </FormGroup>

                                {selectedFile && (
                                    <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                        <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                    </div>
                                )}

                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="mb-3">
                                        <div className="progress">
                                            <div
                                                className="progress-bar progress-bar-striped progress-bar-animated"
                                                role="progressbar"
                                                style={{ width: `${uploadProgress}%` }}
                                            >
                                                {uploadProgress}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button color="info" type="submit" disabled={uploadProgress > 0 && uploadProgress < 100}>
                                    <i className="nc-icon nc-cloud-upload-94"></i> Upload Report
                                </Button>
                            </Form>

                            <hr className="my-4" />

                            <div className="text-center" style={{ padding: "40px 20px" }}>
                                <i className="nc-icon nc-paper" style={{ fontSize: "48px", color: "#ccc", marginBottom: "15px" }}></i>
                                <h5 className="text-muted">No Previous Reports</h5>
                                <p className="text-muted">Your uploaded reports will appear here</p>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Reports;
