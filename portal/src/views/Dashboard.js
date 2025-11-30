import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Badge,
  Progress,
} from "reactstrap";

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Security metrics data
  const securityMetrics = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Security Events",
        data: [12, 19, 15, 25, 22, 18, 20],
        fill: true,
        backgroundColor: "rgba(0, 68, 124, 0.1)",
        borderColor: "#00447c",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <>
      <div className="content">
        {/* Welcome Banner */}
        <Row>
          <Col md="12">
            <Card style={{ background: "linear-gradient(135deg, #00447c 0%, #2d2926 100%)", color: "white", border: "none" }}>
              <CardBody>
                <Row>
                  <Col md="8">
                    <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
                      Welcome back, {user?.full_name || "User"}
                    </h3>
                    <p style={{ opacity: 0.9, marginBottom: "15px" }}>
                      {user?.department || "Department"} • {user?.role || "Role"}
                    </p>
                    <p style={{ opacity: 0.8 }}>
                      Here's what's happening with your security operations today
                    </p>
                  </Col>
                  <Col md="4" className="text-right">
                    <div style={{ fontSize: "48px", opacity: 0.3 }}>
                      <i className="nc-icon nc-badge" />
                    </div>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Security Stats Cards */}
        <Row>
          <Col lg="3" md="6" sm="6">
            <Card className="card-stats" style={{ borderLeft: "4px solid #00447c" }}>
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center" style={{ color: "#00447c" }}>
                      <i className="nc-icon nc-lock-circle-open" style={{ fontSize: "2.5em" }} />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: "0.85em", color: "#666" }}>Active Threats</p>
                      <CardTitle tag="p" style={{ fontSize: "1.8em", fontWeight: "bold", color: "#00447c" }}>3</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <div style={{ padding: "10px 20px", background: "#f8f9fa", fontSize: "0.85em", color: "#666" }}>
                <i className="nc-icon nc-refresh-69" /> Last updated 5m ago
              </div>
            </Card>
          </Col>

          <Col lg="3" md="6" sm="6">
            <Card className="card-stats" style={{ borderLeft: "4px solid #28a745" }}>
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center" style={{ color: "#28a745" }}>
                      <i className="nc-icon nc-satisfied" style={{ fontSize: "2.5em" }} />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: "0.85em", color: "#666" }}>Security Score</p>
                      <CardTitle tag="p" style={{ fontSize: "1.8em", fontWeight: "bold", color: "#28a745" }}>94%</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <div style={{ padding: "10px 20px", background: "#f8f9fa", fontSize: "0.85em", color: "#666" }}>
                <i className="nc-icon nc-chart-bar-32" /> +3% from last week
              </div>
            </Card>
          </Col>

          <Col lg="3" md="6" sm="6">
            <Card className="card-stats" style={{ borderLeft: "4px solid #ffc107" }}>
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center" style={{ color: "#ffc107" }}>
                      <i className="nc-icon nc-zoom-split" style={{ fontSize: "2.5em" }} />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: "0.85em", color: "#666" }}>Scans Today</p>
                      <CardTitle tag="p" style={{ fontSize: "1.8em", fontWeight: "bold", color: "#ffc107" }}>127</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <div style={{ padding: "10px 20px", background: "#f8f9fa", fontSize: "0.85em", color: "#666" }}>
                <i className="nc-icon nc-time-alarm" /> 24h monitoring
              </div>
            </Card>
          </Col>

          <Col lg="3" md="6" sm="6">
            <Card className="card-stats" style={{ borderLeft: "4px solid #17a2b8" }}>
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center" style={{ color: "#17a2b8" }}>
                      <i className="nc-icon nc-single-02" style={{ fontSize: "2.5em" }} />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category" style={{ fontSize: "0.85em", color: "#666" }}>Team Members</p>
                      <CardTitle tag="p" style={{ fontSize: "1.8em", fontWeight: "bold", color: "#17a2b8" }}>27</CardTitle>
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <div style={{ padding: "10px 20px", background: "#f8f9fa", fontSize: "0.85em", color: "#666" }}>
                <i className="nc-icon nc-badge" /> Across 4 departments
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row>
          <Col md="8">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" style={{ color: "#00447c", fontWeight: "bold" }}>
                  Security Events - Last 7 Days
                </CardTitle>
                <p className="card-category" style={{ color: "#666" }}>Weekly security monitoring overview</p>
              </CardHeader>
              <CardBody style={{ height: "300px" }}>
                <Line data={securityMetrics} options={chartOptions} />
              </CardBody>
            </Card>
          </Col>

          <Col md="4">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" style={{ color: "#00447c", fontWeight: "bold" }}>
                  Department Status
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "500" }}>EPA</span>
                    <Badge color="success">Secure</Badge>
                  </div>
                  <Progress value={95} color="success" style={{ height: "8px" }} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "500" }}>CIVA-I</span>
                    <Badge color="success">Secure</Badge>
                  </div>
                  <Progress value={92} color="success" style={{ height: "8px" }} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "500" }}>AFD</span>
                    <Badge color="warning">Monitor</Badge>
                  </div>
                  <Progress value={78} color="warning" style={{ height: "8px" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "500" }}>AI Sec</span>
                    <Badge color="success">Secure</Badge>
                  </div>
                  <Progress value={88} color="success" style={{ height: "8px" }} />
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5" style={{ color: "#00447c", fontWeight: "bold" }}>
                  Recent Security Activity
                </CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ borderLeft: "3px solid #00447c", paddingLeft: "15px", marginBottom: "15px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "5px" }}>Vulnerability Scan Completed</div>
                  <div style={{ fontSize: "0.85em", color: "#666" }}>
                    EPA - All systems passed security checks
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: "5px" }}>
                    <i className="nc-icon nc-time-alarm" /> 2 hours ago
                  </div>
                </div>
                <div style={{ borderLeft: "3px solid #28a745", paddingLeft: "15px", marginBottom: "15px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "5px" }}>Security Patch Applied</div>
                  <div style={{ fontSize: "0.85em", color: "#666" }}>
                    CIVA-I - Critical updates successfully deployed
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: "5px" }}>
                    <i className="nc-icon nc-time-alarm" /> 5 hours ago
                  </div>
                </div>
                <div style={{ borderLeft: "3px solid #ffc107", paddingLeft: "15px", marginBottom: "15px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "5px" }}>Access Review Required</div>
                  <div style={{ fontSize: "0.85em", color: "#666" }}>
                    AFD - Quarterly access audit pending review
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: "5px" }}>
                    <i className="nc-icon nc-time-alarm" /> 1 day ago
                  </div>
                </div>
                <div style={{ borderLeft: "3px solid #17a2b8", paddingLeft: "15px" }}>
                  <div style={{ fontWeight: "500", marginBottom: "5px" }}>Security Training Completed</div>
                  <div style={{ fontSize: "0.85em", color: "#666" }}>
                    AI Sec - 12 team members completed annual training
                  </div>
                  <div style={{ fontSize: "0.75em", color: "#999", marginTop: "5px" }}>
                    <i className="nc-icon nc-time-alarm" /> 2 days ago
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Dashboard;
