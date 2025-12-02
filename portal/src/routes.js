import Dashboard from "views/Dashboard.js";
import Teams from "views/Teams.js";
import Projects from "views/Projects.js";
import Reports from "views/Reports.js";
import UserPage from "views/User.js";

var routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "nc-icon nc-chart-pie-36",
    component: <Dashboard />,
    layout: "",
  },
  {
    path: "/teams",
    name: "Teams",
    icon: "nc-icon nc-badge",
    component: <Teams />,
    layout: "",
  },
  {
    path: "/projects",
    name: "Projects",
    icon: "nc-icon nc-briefcase-24",
    component: <Projects />,
    layout: "",
  },
  {
    path: "/reports",
    name: "Reports",
    icon: "nc-icon nc-paper",
    component: <Reports />,
    layout: "",
  },
  {
    path: "/profile",
    name: "Profile",
    icon: "nc-icon nc-single-02",
    component: <UserPage />,
    layout: "",
  },
];
export default routes;
