import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
  Badge,
  Alert,
  Input,
  InputGroup,
  Button,
} from "reactstrap";

function Teams() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

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
        fetchEmployees();
      }
    }
  }, [uid]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees.php");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    try {
      const response = await fetch(`/api/search.php?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResult(data);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setSearchResult({ found: false, message: "Search failed" });
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Team Members</CardTitle>
                <p className="card-category">All employees in the organization</p>
              </CardHeader>
              <CardBody>
                {/* Search Bar */}
                <div style={{ marginBottom: "20px" }}>
                  <InputGroup>
                    <Input
                      type="text"
                      placeholder="Search by name, department, role, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button color="info" onClick={handleSearch}>
                      <i className="nc-icon nc-zoom-split" /> Search
                    </Button>
                  </InputGroup>

                  {searchResult && (
                    <Alert
                      color={searchResult.found ? "success" : "warning"}
                      style={{ marginTop: "10px" }}
                    >
                      <strong>{searchResult.found ? "✓" : "✗"}</strong> {searchResult.message}
                    </Alert>
                  )}
                </div>
                <Table responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Loading...
                        </td>
                      </tr>
                    ) : employees.length > 0 ? (
                      employees.map((employee) => (
                        <tr key={employee.employee_id}>
                          <td>{employee.employee_id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                className="avatar mr-2"
                                style={{
                                  backgroundColor: "#51cbce",
                                  width: "30px",
                                  height: "30px",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "12px",
                                }}
                              >
                                {getInitials(employee.full_name)}
                              </div>
                              {employee.full_name}
                            </div>
                          </td>
                          <td>{employee.email}</td>
                          <td>
                            <Badge color="info">{employee.department}</Badge>
                          </td>
                          <td>{employee.role}</td>
                          <td>{employee.manager_name || "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Teams;
