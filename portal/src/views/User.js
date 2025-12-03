/*!

=========================================================
* Paper Dashboard React - v1.3.2
=========================================================

* Product Page: https://www.creative-tim.com/product/paper-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

* Licensed under MIT (https://github.com/creativetimofficial/paper-dashboard-react/blob/main/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
  Alert,
} from "reactstrap";

function User() {
  const [searchParams] = useSearchParams();
  const [accessDenied, setAccessDenied] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    try {
      const response = await fetch('/api/change_password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordStatus({ type: 'success', message: data.message });
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setPasswordStatus({ type: 'danger', message: data.message });
      }
    } catch (error) {
      setPasswordStatus({ type: 'danger', message: 'Failed to change password. Please try again.' });
    }
  };

  const handlePasswordInputChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <div className="content">
        <Row>
          <Col md="4">
            <Card className="card-user">
              <div className="image">
                <img alt="..." src={require("assets/img/damir-bosnjak.jpg")} />
              </div>
              <CardBody>
                <div className="author">
                  <a href="#pablo" onClick={(e) => e.preventDefault()}>
                    <img
                      alt="..."
                      className="avatar border-gray"
                      src={require("assets/img/stefan.png")}
                    />
                    <h5 className="title">Peter Schneider</h5>
                  </a>
                  <p className="description">@peter.schneider</p>
                </div>
                <p className="description text-center">
                  "Security is not a product, <br />
                  but a process of <br />continuous improvement"
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Team Leads</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="list-unstyled team-members">
                  <li>
                    <Row>
                      <Col md="2" xs="2">
                        <div className="avatar">
                          <img
                            alt="..."
                            className="img-circle img-no-padding img-responsive"
                            src={require("assets/img/team1.png")}
                          />
                        </div>
                      </Col>
                      <Col md="7" xs="7">
                        Klaus Weber <br />
                        <span className="text-success">
                          <small>Available</small>
                        </span>
                      </Col>
                      <Col className="text-right" md="3" xs="3">
                        <Button
                          className="btn-round btn-icon"
                          color="success"
                          outline
                          size="sm"
                        >
                          <i className="fa fa-envelope" />
                        </Button>
                      </Col>
                    </Row>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </Col>
          <Col md="8">
            <Card className="card-user">
              <CardHeader>
                <CardTitle tag="h5">Edit Profile</CardTitle>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col className="pr-1" md="5">
                      <FormGroup>
                        <label>Company (disabled)</label>
                        <Input
                          defaultValue="Mercedes-Benz Tech Innovation"
                          disabled
                          placeholder="Company"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col className="px-1" md="3">
                      <FormGroup>
                        <label>Username</label>
                        <Input
                          defaultValue="peter.schneider"
                          placeholder="Username"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col className="pl-1" md="4">
                      <FormGroup>
                        <label htmlFor="exampleInputEmail1">
                          Email address
                        </label>
                        <Input
                          placeholder="Email"
                          type="email"
                          defaultValue="peter.schneider@mbti.de"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="pr-1" md="6">
                      <FormGroup>
                        <label>First Name</label>
                        <Input
                          defaultValue="Peter"
                          placeholder="Company"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col className="pl-1" md="6">
                      <FormGroup>
                        <label>Last Name</label>
                        <Input
                          defaultValue="Schneider"
                          placeholder="Last Name"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Address</label>
                        <Input
                          defaultValue="Gropiusplatz 10"
                          placeholder="Home Address"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="pr-1" md="4">
                      <FormGroup>
                        <label>City</label>
                        <Input
                          defaultValue="Stuttgart"
                          placeholder="City"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col className="px-1" md="4">
                      <FormGroup>
                        <label>Country</label>
                        <Input
                          defaultValue="Germany"
                          placeholder="Country"
                          type="text"
                        />
                      </FormGroup>
                    </Col>
                    <Col className="pl-1" md="4">
                      <FormGroup>
                        <label>Postal Code</label>
                        <Input
                          placeholder="ZIP Code"
                          type="text"
                          defaultValue="70563"
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>About Me</label>
                        <Input
                          type="textarea"
                          defaultValue="Junior Security Analyst at Mercedes-Benz Tech Innovation CIVA-I Department. Focused on secure software development and vulnerability assessment. Based in Stuttgart, passionate about cybersecurity and continuous learning."
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <div className="update ml-auto mr-auto">
                      <Button
                        className="btn-round"
                        color="primary"
                        type="submit"
                      >
                        Update Profile
                      </Button>
                    </div>
                  </Row>
                </Form>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle tag="h5">Change Password</CardTitle>
              </CardHeader>
              <CardBody>
                {passwordStatus && (
                  <Alert color={passwordStatus.type}>
                    {passwordStatus.message}
                  </Alert>
                )}
                <Form onSubmit={handlePasswordChange}>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Current Password</label>
                        <Input
                          name="current_password"
                          placeholder="Enter current password"
                          type="password"
                          value={passwordData.current_password}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>New Password</label>
                        <Input
                          name="new_password"
                          placeholder="Enter new password (min 8 characters)"
                          type="password"
                          value={passwordData.new_password}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Confirm New Password</label>
                        <Input
                          name="confirm_password"
                          placeholder="Confirm new password"
                          type="password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordInputChange}
                          required
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <div className="update ml-auto mr-auto">
                      <Button
                        className="btn-round"
                        color="primary"
                        type="submit"
                      >
                        Change Password
                      </Button>
                    </div>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default User;
