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
} from "reactstrap";

function Teams() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");

  useEffect(() => {
    fetchEmployees();
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

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

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
