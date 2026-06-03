import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Unauthorized from "../components/Unauthorized/UnAuthorized";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../Context/AuthContext";
import AuthRedirectWrapper from "./AuthRedirectWrapper ";

// Lazy-loaded components for code splitting
const LoginPage1 = lazy(() => import("../components/Login/Login1"));
const AdminUserPanel = lazy(() => import("../components/AdminUserPanel/AdminUserPanel"));
const ItemNamePage = lazy(() => import("../components/ItemNamePage"));
const SitePage = lazy(() => import("../components/SitePage"));
const EnquiryPage = lazy(() => import("../pages/EnquiryPage").then(m => ({ default: m.EnquiryPage })));
const ClientsPage = lazy(() => import("../components/ClientsPage"));
const ReimbursementsPage = lazy(() => import("../components/ReimbursementsPage"));
const RevenuePages = lazy(() => import("../pages/RevenuePage").then(m => ({ default: m.RevenuePages })));
const PolicyDashBoardPage = lazy(() => import("../components/PolicyDashBoardPage"));
const PolicyPage = lazy(() => import("../pages/PolicyPage").then(m => ({ default: m.PolicyPage })));
const PolicyGroupPage = lazy(() => import("../pages/PolicyGroupPage"));
const CompanyPage = lazy(() => import("../components/CompanyPage"));
const PolicyTypePage = lazy(() => import("../components/PolicyTypePage"));
const PolicyNamePage = lazy(() => import("../components/PolicyNamePage"));
const CompanyFormFieldPage = lazy(() => import("../components/CompanyFormFieldPage"));
const AgentPage = lazy(() => import("../components/AgentPage"));
const CommissionRuleTable = lazy(() => import("../components/CommissionRule/CommissionRule"));
const CommissionDashboard = lazy(() => import("../components/CommissionDashboard"));
const PolicyViewPage = lazy(() => import("../pages/PolicyViewPage").then(m => ({ default: m.PolicyViewPage })));
const PolicyEditPage = lazy(() => import("../pages/PolicyEditPage").then(m => ({ default: m.PolicyEditPage })));
const PolicyCreatePage = lazy(() => import("../pages/PolicyCreatePage").then(m => ({ default: m.PolicyCreatePage })));
const NotFound = lazy(() => import("../components/NotFound/NotFound"));

// Loading fallback
const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
              path="/admin/commission-dashboard"
              element={
                <ProtectedRoute requiredPermission="Commission">
                  <CommissionDashboard />
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
      </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AllRoute;
