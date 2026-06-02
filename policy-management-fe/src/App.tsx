import { matchPath, useLocation } from "react-router-dom";
import AllRoute from "./AllRoutes/AllRoute";
import Sidebar from "./components/Sidebar/Sidebar";

function App() {

  const location = useLocation();

  // Define paths where the sidebar should be hidden (exact matches)
  const hiddenSidebarPaths = [
    "/", 
    "/register/user/superAdmin", 
    "/unauthorized", 
    "*"
  ];

  // Define patterns where the sidebar should be shown (exact and dynamic)
  const showSidebarPatterns = [
    "/admin/policydashboard",
    "/admin/users",
    "/admin/site",
    "/admin/items",
    "/admin/all-enquiries",
    "/admin/all-policies",
    "/admin/clients",
    "/admin/agents",
    "/admin/reimbursement",
    "/admin/commission",
    "/admin/revenues",
    "/admin/policy-groups",
    "/admin/companies",
    "/admin/policy-types",
    "/admin/policy-names",
    "/admin/company-form-fields",
    "admin/commission-rule",
    "/admin/policies/new",
    "/admin/policies/create",
    "/admin/policies", // list page
    "/admin/policies/:policyId/view", // dynamic policy details page
    "/admin/policies/:policyId/edit", // dynamic policy edit page
  ];

  // Check if the current path is in the hidden list (exact match)
  const isHiddenSidebar = hiddenSidebarPaths.includes(location.pathname);

  // Check if the current path matches any of the showSidebarPatterns (including dynamic)
  const isShowSidebar = showSidebarPatterns.some(pattern =>
    matchPath({ path: pattern, end: true }, location.pathname)
  );

  // Sidebar should show only if not hidden and matches a show pattern
  const sidebarFlag = !isHiddenSidebar && isShowSidebar;

  console.log(location.pathname);
  console.log(isHiddenSidebar);
  console.log(isShowSidebar);
  console.log(sidebarFlag); 

  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-dvh flex flex-col md:flex-row">
      {/* Sidebar */}
      {sidebarFlag && (
        <div className="
          w-full md:w-54 lg:w-56 // Using rem-based widths
          flex-shrink-0 
          md:fixed md:inset-y-0 md:start-0 md:z-10
          max-h-dvh
        ">
          <Sidebar />
        </div>
      )}
      
      {/* Main Content */}
      <main 
        className={`
          flex-1 w-full min-w-0
          ${sidebarFlag 
            ? 'md:ms-56 lg:ms-56' // Matching sidebar widths
            : 'md:ms-0'
          }
          px-4 sm:px-5 md:px-5 lg:px-5
          transition-all duration-300 ease-in-out
        `}
      >
        {children}
      </main>
    </div>
  );

  return (
    <Layout>
      <AllRoute />
    </Layout>
  );
}

export default App;