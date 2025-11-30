import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
    Alert,
    Container,
} from "reactstrap";

function Login() {
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    employee_id: employeeId,
                    password: password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.token);
                navigate("/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            background: "linear-gradient(135deg, #00447c 0%, #2d2926 100%)",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md="8" lg="6">
                        <Card className="card-login">
                            <CardHeader className="text-center">
                                <img
                                    src="/images/mbti-logo.jpg"
                                    alt="MBTI Logo"
                                    style={{ width: "80px", marginBottom: "15px" }}
                                />
                                <CardTitle tag="h3" style={{ marginBottom: "5px" }}>
                                    MBTI Employee Portal
                                </CardTitle>
                                <p className="text-muted">Please log in with your credentials</p>
                            </CardHeader>
                            <CardBody>
                                {error && <Alert color="danger">{error}</Alert>}
                                <Form onSubmit={handleLogin}>
                                    <FormGroup>
                                        <label>Employee ID</label>
                                        <Input
                                            placeholder="Enter your employee ID (e.g., MBTI2024XXX)"
                                            type="text"
                                            value={employeeId}
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Password</label>
                                        <Input
                                            placeholder="Enter your password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                    <Button
                                        block
                                        className="btn-round"
                                        color="primary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? "Logging in..." : "Log In"}
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Login;
