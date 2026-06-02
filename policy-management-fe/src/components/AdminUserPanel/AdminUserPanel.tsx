import { getUserColumns } from "../../Users/components/columns.tsx";
import { DataTable } from "../ui/data-table.tsx";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button.tsx";
import { Label } from "../ui/label.tsx";
import { Input } from "../ui/input.tsx";
// import { RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.tsx";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/ui/select";

import { useAuth } from "../../Context/AuthContext";


// Define the Site interface based on the response
// interface Site {
//   id: string;
//   name: string;
//   address: string | null;
// }

// Update UserData interface to match the response structure
interface UserData {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
  app_access: boolean;
  web_access: boolean;
  permissions: {
    app: string[];
    web: string[];
  };
  role: string;
  sites: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export default function AdminUserPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fetchingInBackground, setFetchingInBackground] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  const { role } = useAuth();
  const isOperations = role?.role_name === "OPERATIONS";

  console.log(fetchingInBackground);
  const fetchUsers = useCallback(
    async (showAnimation: boolean = false, pageToFetch: number = currentPage) => {
      try {
        if (showAnimation) setShowLoadingAnimation(true);
        if (!showAnimation) setShowLoadingAnimation(false);

        const queryParams = new URLSearchParams();
        queryParams.append("limit", itemsPerPage.toString());
        queryParams.append("offset", (itemsPerPage * (pageToFetch - 1)).toString());
        queryParams.append("withCount", "true");
        queryParams.append("orderBy", JSON.stringify({ created_at: "desc" }));

        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/v1/users?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        const data = await response.data;
        setUsers(data.data);
        setTotalItemsCount(data.totalCount);
        setFetchingInBackground(true);
      } catch (error) {
        toast.error("Error", {
          description: "Failed to fetch users, please try again!",
        });
        console.log(error);
        setFetchingInBackground(false);
      } finally {
        setShowLoadingAnimation(false);
      }
    },
    [currentPage, itemsPerPage]
  );

  useEffect(() => {
    fetchUsers(true);

    const interval = setInterval(() => {
      fetchUsers(false);
    }, 500000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUsers]);

  const onAction = useCallback(
    (
      user: UserData,
      action: "update" | "delete" | "toggle" | "toggleApp" | "toggleWeb",
      setShowLoadingSpinner: React.Dispatch<React.SetStateAction<boolean>>
    ): Promise<void> => {
      return (async () => {
        try {
          if (action === "delete") {
            await axios.delete(
              `${import.meta.env.VITE_BASE_URL}/api/v1/user/${user.id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
              }
            );
            // Refresh the users list after deletion
            fetchUsers(true, currentPage);
          } else if (action === "toggle") {
            const payload = { status: user.status };
            await axios.patch(
              `${import.meta.env.VITE_BASE_URL}/api/v1/user/${user.id}/status`,
              JSON.stringify(payload),
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  "Content-Type": "application/json",
                },
              }
            );
            fetchUsers(true, currentPage);
          } else if (action === "toggleApp") {
            const payload = { app_access: user.app_access };
            await axios.patch(
              `${import.meta.env.VITE_BASE_URL}/api/v1/user/${user.id}/app-access`,
              JSON.stringify(payload),
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  "Content-Type": "application/json",
                },
              }
            );
            fetchUsers(true, currentPage);
          } else if (action === "toggleWeb") {
            const payload = { web_access: user.web_access };
            await axios.patch(
              `${import.meta.env.VITE_BASE_URL}/api/v1/user/${user.id}/web-access`,
              JSON.stringify(payload),
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  "Content-Type": "application/json",
                },
              }
            );
            fetchUsers(true, currentPage);
          } else {
            const payload: {
              name: string | undefined;
              phone: string | undefined;
              role: string | undefined;
              site_ids: string[];
              permissions: {
                app: string[];
                web: string[];
              };
              app_access: boolean;
              web_access: boolean;
              email?: string | null;
            } = {
              name: user.name,
              phone: user.phone?.toString(),
              role: user.role,
              site_ids: (user.sites || []).map(site => site.id),
              permissions: {
                app: user.app_access ? user.permissions?.app ?? [] : [],
                web: user.web_access ? user.permissions?.web ?? [] : [],
              },
              app_access: user.app_access ?? false,
              web_access: user.web_access ?? false,
            };
            // Always include email field, even if it's null (to clear it)
            payload.email = user.email;

            await axios.patch(
              `${import.meta.env.VITE_BASE_URL}/api/v1/user/${user.id}`,
              JSON.stringify(payload),
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                  "Content-Type": "application/json",
                },
              }
            );
            fetchUsers(true, currentPage);
          }

          let successMessage = "User action completed successfully";
          if (action === "toggle") successMessage = "User status updated successfully";
          if (action === "toggleApp") successMessage = "App access updated successfully";
          if (action === "toggleWeb") successMessage = "Web access updated successfully";
          if (action === "delete") successMessage = "User deleted successfully";
          if (action === "update") successMessage = "User updated successfully";

          toast.success("Success", {
            description: successMessage,
          });
        } catch (err) {
          console.log(err);
          if (axios.isAxiosError(err) && err.response) {
            const errorMessage =
              err.response.data?.message || 
              err.response.data?.details?.[0]?.message || 
              "Something went wrong.";
            
            toast.error("Error", { description: errorMessage });
          } else {
            toast.error("Error", { description: "An unexpected error occurred." });
          }
          // Re-throw the error so the calling function can catch it
          throw err;
        } finally {
          setShowLoadingSpinner(false);
        }
      })();
    },
    [currentPage, fetchUsers]
  );

  const columns = useMemo(() => getUserColumns({ onAction, readOnly: Boolean(isOperations) }), [onAction, isOperations]);

  return (
    <>
      <div className="p-2 ">
        {showCreateUserDialog && !isOperations && (
          <CreateUserDialog
            setShowCreateUserDialog={setShowCreateUserDialog}
            fetchUsers={fetchUsers}
            currentPage={currentPage}
          />
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
          </div>
          <div className="flex justify-center items-center space-x-3">
            {!isOperations && (
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-white mt-1 px-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateUserDialog(true)}
              >
                Add User
              </Button>
            )}
            {/* <Button
              size="sm"
              variant="outline"
              className="border-gray-300 mt-1"
              onClick={() => fetchUsers(true)}
            >
              <RefreshCcw className="scale-90" />
            </Button> */}
          </div>
        </div>
        <DataTable
          data={users.map(user => ({
            ...user,
            phone: user.phone.toString(),
            status: user.status === "Active" || user.status === "Inactive" ? (user.status as "Active" | "Inactive") : "Inactive",
          }))}
          columns={columns}
          isLoading={showLoadingAnimation}
          totalItemsCount={totalItemsCount}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          setCurrentPage={setCurrentPage}
          setItemsPerPage={setItemsPerPage}
        />
      </div>
    </>
  );
}

function CreateUserDialog({
  setShowCreateUserDialog,
  fetchUsers,
  currentPage,
}: {
  fetchUsers: (showAnimation: boolean, pageToFetch: number) => void;
  setShowCreateUserDialog: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: number;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isWebPermissionsDialogOpen, setIsWebPermissionsDialogOpen] = useState(false);

  const [webAccess, setWebAccess] = useState(false);

  const [webPermissions, setWebPermissions] = useState<string[]>([]);
  const [allWebPermissions, setAllWebPermissions] = useState(false);

  // Function to reset form fields
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("ADMIN");
    setWebAccess(false);
    setWebPermissions([]);
    setAllWebPermissions(false);
  };

  // const availableWebPermissions = ["Dashboard", "Users_Panel", "Site", "Items", "All_Enquiry"];
// All possible permissions (for backend)
const allAvailableWebPermissions = [
  // "Master",
  "Users_Panel",
  // "All_Enquiry",
  "All_Policy",
  "Dashboard",
  // "Items",
  // "Policy Group",
  // "Site",
  // "Revenues",
  // "Reimbursement",
  "Commission",
  // "Clients",
  // "Agents",
  // "Agent",
  // "PolicyType",
  // "PolicyGroup",
  // "PolicyName",
  // "Company",
  // "CompanyFormField",
];

// Visible permissions (for frontend)
const visibleWebPermissions = [
  // "Master",
  // "Revenues",
  "Users_Panel",
  // "All_Enquiry",
  "All_Policy",
  // "Policy Group",
  "Dashboard",
  // "Commission",
  // "Agents",
  // "Agent",
  "Commission",
  // "PolicyType",
  // "PolicyGroup",
  // "PolicyName",
  // "Company",
  // "CompanyFormField",
];

const masterPermissions = ["Items", "Site", "Reimbursement", "Clients"];

const handleWebPermissionChange = (permission: string) => {
  if (permission === "Master") {
    if (webPermissions.includes("Master")) {
      // Remove Master and all associated permissions
      const updatedPermissions = webPermissions.filter(
        p => p !== "Master" && !masterPermissions.includes(p)
      );
      setWebPermissions(updatedPermissions);
      setAllWebPermissions(false);
    } else {
      // Add Master and all associated permissions
      const updatedPermissions = [
        ...webPermissions.filter(p => !masterPermissions.includes(p)),
        "Master",
        ...masterPermissions
      ];
      setWebPermissions(updatedPermissions);
      if (updatedPermissions.length === allAvailableWebPermissions.length) {
        setAllWebPermissions(true);
      }
    }
  } else {
    if (webPermissions.includes(permission)) {
      const updatedPermissions = webPermissions.filter((p) => p !== permission);
      setWebPermissions(updatedPermissions);
      // If Master was checked, uncheck it when any permission is removed
      if (updatedPermissions.includes("Master")) {
        setWebPermissions(updatedPermissions.filter(p => p !== "Master"));
      }
      setAllWebPermissions(false);
    } else {
      const updatedPermissions = [...webPermissions, permission];
      setWebPermissions(updatedPermissions);
      if (updatedPermissions.length === allAvailableWebPermissions.length) {
        setAllWebPermissions(true);
      }
    }
  }
  // Update webAccess based on whether any permissions are selected
  setWebAccess(webPermissions.length > 0 || permission === "Master");
};
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Remove the unused sitesRes variable
        // const [sitesRes] = await Promise.all([
        //   axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/sites`, {
        //     headers: {
        //       Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        //     },
        //   }),
        // ]);
        // setSites(sitesRes.data); // This line was removed
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchData();
  }, []);

  interface CreateUserPayload {
    email: string | null;
    name: string;
    role: string;
    phone: string;
    site_ids: string[]; // Changed from site_id to site_ids
    app_access: boolean;
    web_access: boolean;
    permissions: {
      app: string[];
      web: string[];
    };
  }

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setIsDisabled(true);

      const payload: CreateUserPayload = {
        email: email || null,
        name,
        role,
        phone,
        site_ids: [], // Use array of site IDs
        app_access: false, // Default to false
        web_access: webAccess,
        permissions: {
          app: [],
          web: webAccess ? webPermissions : [],
        },
      };

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/v1/register`,
        JSON.stringify(payload),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      toast.success("User created successfully", {
        description: "User created successfully",
      });

      // Refresh the users list with animation to show the new user
      fetchUsers(true, currentPage);
      
      // Reset form fields
      resetForm();
      
      // Close the dialog after successful creation
      setShowCreateUserDialog(false);
    } catch (err) {
      console.log(err);
      
      if (axios.isAxiosError(err) && err.response) {
        console.log("Error response data:", err.response.data);
        console.log("Error response status:", err.response.status);
        
        const errorMessage = 
          err.response.data?.message || 
          err.response.data?.details?.[0]?.message || 
          "Failed to create user";
        
        console.log("Extracted error message:", errorMessage);
        
        toast.error("Error", {
          description: errorMessage,
        });
      } else {
        toast.error("Failed to create user", {
          description: "Failed to create user",
        });
      }
    } finally {
      setIsDisabled(false);
    }
  }

  const requiredField = <span className="text-red-500 ml-1">*</span>;

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        setShowCreateUserDialog(false);
      }
    }}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <div className="flex justify-start">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-left">Create User</DialogTitle>
          </DialogHeader>
        </div>
        <form onSubmit={(e) => createUser(e)} className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="name" className="text-left">
                Name{requiredField}
              </Label>
              <Input
                id="name"
                value={name}
                className="col-span-3"
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="phone" className="text-left">
                Phone{requiredField}
              </Label>
              <Input
                id="phone"
                type="phone"
                value={phone}
                className="col-span-3"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(value);
                }}
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </div>
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="role" className="text-left">
                Role{requiredField}
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="sites" className="text-left">
                Sites{requiredField}
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedSites[0] || ""}
                  onValueChange={(value) => {
                    const newSites = selectedSites.includes(value)
                      ? selectedSites.filter(id => id !== value)
                      : [...selectedSites, value];
                    setSelectedSites(newSites);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sites" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} {selectedSites.includes(site.id) ? '(Selected)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSites.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSites.map(siteId => {
                      const site = sites.find(s => s.id === siteId);
                      return site ? (
                        <div key={site.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center">
                          {site.name}
                          <button
                            type="button"
                            onClick={() => setSelectedSites(prev => prev.filter(id => id !== site.id))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div> */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <Label htmlFor="email" className="text-left">
                Email (Optional)
              </Label>
              <Input
                id="email"
                className="col-span-3"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (optional)"
              />
            </div>
            {/* <div className="grid grid-cols-4 gap-4 items-center">
              <Label className="text-left">Access{requiredField}</Label>
              <div className="col-span-3 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="appAccess"
                    className="h-3.5 w-3.5 cursor-pointer"
                    checked={appAccess}
                    onChange={() => setAppAccess(!appAccess)}
                  />
                  <Label htmlFor="appAccess" className="cursor-pointer">
                    App Access
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="webAccess"
                    className="h-3.5 w-3.5 cursor-pointer"
                    checked={webAccess}
                    onChange={() => {
                      setWebAccess(!webAccess);
                      if (!webAccess) {
                        setIsWebPermissionsDialogOpen(true);
                      }
                    }}
                  />
                  <Label htmlFor="webAccess" className="cursor-pointer">
                    Web Access
                  </Label>
                </div>
              </div>
            </div>
            {webAccess && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWebPermissionsDialogOpen(true)}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300"
                >
                  Configure Web Permissions
                </Button>
              </div>
            )} */}
            <div className="border border-gray-200 rounded-md p-4 space-y-4">
            {/* Access Toggles - App Access Only */}
            {/* <div className="flex items-center gap-20 pb-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="appAccess"
                    checked={appAccess}
                    onChange={() => setAppAccess(!appAccess)}
                    className="peer h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="appAccess" className="ml-2 cursor-pointer text-sm font-medium">
                    App Access
                  </Label>
                </div>
              </div>
            </div> */}

            {/* Web Permissions Section - Handled Automatically */}
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="relative flex items-center border-b border-gray-300 pb-2">
                  <input
                    type="checkbox"
                    id="all-web-permissions"
                    checked={allWebPermissions}
                    onChange={() => {
                      if (allWebPermissions) {
                        setWebPermissions([]);
                        setAllWebPermissions(false);
                        setWebAccess(false); // Auto-disable web access
                      } else {
                        setWebPermissions([...allAvailableWebPermissions])
                        setAllWebPermissions(true);
                        setWebAccess(true); // Auto-enable web access
                      }
                    }}
                    className="peer h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label 
                    htmlFor="all-web-permissions" 
                    className="ml-2 cursor-pointer text-sm font-medium text-gray-900"
                  >
                    All Web Permissions
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
                {visibleWebPermissions.map((permission) => (
                  <div key={permission} className="flex items-center">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id={`web-${permission}`}
                        checked={webPermissions.includes(permission)}
                        onChange={() => {
                          // let updatedPermissions;
                          // if (webPermissions.includes(permission)) {
                          //   updatedPermissions = webPermissions.filter(p => p !== permission);
                          //   setWebPermissions(updatedPermissions);
                          //   if (updatedPermissions.length === 0) {
                          //     setWebAccess(false); // Auto-disable if none selected
                          //   }
                          //   setAllWebPermissions(false);
                          // } else {
                          //   updatedPermissions = [...webPermissions, permission];
                          //   setWebPermissions(updatedPermissions);
                          //   setWebAccess(true); // Auto-enable if at least one is selected
                          //   if (updatedPermissions.length === availableWebPermissions.length) {
                          //     setAllWebPermissions(true);
                          //   }
                          // }
                          handleWebPermissionChange(permission);
                          setWebAccess(true);
                        }}
                        className="peer h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label 
                        htmlFor={`web-${permission}`} 
                        className="ml-2 cursor-pointer text-sm text-gray-700"
                      >
                        {permission.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isDisabled} className="bg-blue-500 text-white">
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Web Permissions Dialog */}
      <Dialog open={isWebPermissionsDialogOpen} onOpenChange={setIsWebPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-left">Web Permissions</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="border border-gray-300 p-3 rounded">
              <div className="flex border-b border-gray-300 items-center mb-3 pb-2">
                <input
                  type="checkbox"
                  id="all-web-permissions"
                  checked={allWebPermissions}
                  onChange={() => {
                    if (allWebPermissions) {
                      setWebPermissions([]);
                      setAllWebPermissions(false);
                    } else {
                      setWebPermissions([...allAvailableWebPermissions]);
                      setAllWebPermissions(true);
                    }
                  }}
                  className="h-3.5 w-3.5 cursor-pointer mr-2"
                />
                <Label htmlFor="all-web-permissions" className="text-sm cursor-pointer font-semibold">
                  All
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {visibleWebPermissions.map((permission) => (
                  <div key={permission} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`web-${permission}`}
                      checked={webPermissions.includes(permission)}
                      onChange={() => handleWebPermissionChange(permission)}
                      className="h-3.5 w-3.5 cursor-pointer mr-2"
                    />
                    <Label htmlFor={`web-${permission}`} className="text-sm cursor-pointer">
                      {permission.replace("_", " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsWebPermissionsDialogOpen(false)} className="bg-gray-100 hover:bg-gray-200 border border-gray-300">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}