import { Route, Routes } from "react-router-dom";
// import LoginPage from "../components/Login/Login";
// import Register from "../components/Register/Register";
import AdminUserPanel from "../components/AdminUserPanel/AdminUserPanel";
// import AdminDashBoard from "../components/AdminDashBoard/AdminDashBoard";
// import Materials from "../components/Material/Materials";
// import Vendors from "../components/Vendors/Vendors";
// import Trucks from "../components/Trucks/Trucks";
// import ProductOrders from "../components/Orders/PurchaseOrders";
// import PurchaseOrderDetail from "../components/Orders/PurchaseOrderDetail";
// import TruckRegistrationForm from "../components/Trucks/TruckRegistrationForm";
import Unauthorized from "../components/Unauthorized/UnAuthorized";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../Context/AuthContext";
import AuthRedirectWrapper from "./AuthRedirectWrapper ";
// import AdminDashBoard2 from "../components/AdminDashBoard2/AdminDashBoard2";
import LoginPage1 from "../components/Login/Login1";
import ItemNamePage from "../components/ItemNamePage";
// import ItemGroupPage from "../components/ItemGroupPage";
import SitePage from "../components/SitePage";
// import MaterialReceiptPage from "../components/MaterialReceiptPage";
// import { EnquiryForm } from "../components/enquiry/EnquiryForm";
import { EnquiryPage } from "../pages/EnquiryPage";
import ClientsPage from "../components/ClientsPage";
import ReimbursementsPage from "../components/ReimbursementsPage";
// import RevenuePage from "../components/RevenuePage";
import { RevenuePages } from "../pages/RevenuePage";
import PolicyDashBoardPage from "../components/PolicyDashBoardPage";

import { PolicyPage } from "../pages/PolicyPage";
// import CommissionPage from "../components/CommissionPage";
import PolicyGroupPage from "../pages/PolicyGroupPage";
import CompanyPage from "../components/CompanyPage";
import PolicyTypePage from "../components/PolicyTypePage";
import PolicyNamePage from "../components/PolicyNamePage";
import CompanyFormFieldPage from "../components/CompanyFormFieldPage";
import AgentPage from "../components/AgentPage";
import CommissionRuleTable from "../components/CommissionRule/CommissionRule";
import { PolicyViewPage } from "../pages/PolicyViewPage";
import { PolicyEditPage } from "../pages/PolicyEditPage";
import { PolicyCreatePage } from "../pages/PolicyCreatePage";
import NotFound from "../components/NotFound/NotFound";
// import NewPolicyDashboard from "../components/NewPolicyDashboard";

const AllRoute = () => {
const {role, isLoading } = useAuth();
  console.log(role, role?.role_name, "role");
  console.log(isLoading);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 overflow-auto md:pt-0">
        <div className="container">
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                <AuthRedirectWrapper>
                  <LoginPage1 />
                </AuthRedirectWrapper>
              }
            />
            {/* <Route
              path="/register/user/superAdmin"
              element={
                <AuthRedirectWrapper>
                  <Register />
                </AuthRedirectWrapper>
              }
            /> */}
            <Route path="/register/user/superAdmin" element={<NotFound />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes with specific permissions */}

            <Route
              path="/admin/policydashboard"
              element={
                <ProtectedRoute requiredPermission="Dashboard">
                  {/* <AdminDashBoard2 /> */}
                  <PolicyDashBoardPage />
                  {/* <NewPolicyDashboard/> */}
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredPermission="Users_Panel">
                  <AdminUserPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/site"
              element={
                <ProtectedRoute requiredPermission="Site">
                  {/* <Materials /> */}
                  <SitePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items"
              element={
                <ProtectedRoute requiredPermission="Items">
                  <ItemNamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/all-enquiries"
              element={
                <ProtectedRoute requiredPermission="All_Enquiry">
                  <EnquiryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/all-policies"
              element={
                <ProtectedRoute requiredPermission="All_Policy">
                  <PolicyPage />
                </ProtectedRoute>
              }
            />
            {/* Individual Policy Routes */}
            <Route
              path="/admin/policies/:policyId/view"
              element={
                <ProtectedRoute requiredPermission="All_Policy">
                  <PolicyViewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/policies/:policyId/edit"
              element={
                <ProtectedRoute requiredPermission="All_Policy">
                  <PolicyEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/policies/new"
              element={
                <ProtectedRoute requiredPermission="All_Policy">
                  <PolicyCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <ProtectedRoute requiredPermission="Clients">
                  <ClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/agents"
              element={
                <ProtectedRoute requiredPermission="Agent">
                  <AgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reimbursement"
              element={
                <ProtectedRoute requiredPermission="Reimbursement">
                  <ReimbursementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/commission"
              element={
                <ProtectedRoute requiredPermission="Commission">
                  <CommissionRuleTable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/revenues"
              element={
                <ProtectedRoute requiredPermission="Revenues">
                  <RevenuePages />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/policy-groups" 
              element={
                <ProtectedRoute requiredPermission="PolicyGroup">
                  <PolicyGroupPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/companies" 
              element={
                <ProtectedRoute requiredPermission="Company">
                  <CompanyPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/policy-types" 
              element={
                <ProtectedRoute requiredPermission="PolicyType">
                  <PolicyTypePage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/policy-names" 
              element={
                <ProtectedRoute requiredPermission="PolicyName">
                  <PolicyNamePage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin/company-form-fields" 
              element={
                <ProtectedRoute requiredPermission="CompanyFormField">
                  <CompanyFormFieldPage />
                </ProtectedRoute>
              }
            />
            {/* <Route 
              path="/admin/enquiries" 
              element={
                <ProtectedRoute requiredPermission="Enquiry">
                  <EnquiryForm onSubmit={() => {}} />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="/admin/all-enquiries" 
              element={
                <ProtectedRoute requiredPermission="All_Enquiry">
                  <EnquiryPage />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/admin/vendors" 
              element={
                <ProtectedRoute requiredPermission="Vendor">
                  <Vendors />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute requiredPermission="Purchase_Order">
                  <ProductOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/purchase-orders/:id" 
              element={
                <ProtectedRoute requiredPermission="Purchase_Order">
                  <PurchaseOrderDetail />
                </ProtectedRoute>
              } 
            /> */}
            {/* <Route 
              path="/truck-registration" 
              element={
                <ProtectedRoute requiredPermission="Truck">
                  <TruckRegistrationForm />
                </ProtectedRoute>
              } 
            /> */}
            
            {/* 404 Route - Catch all unmatched routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AllRoute;
