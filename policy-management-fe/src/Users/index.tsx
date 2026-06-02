//src/components/AdminUserPanel/AdminUserPanel.tsx
/* eslint-disable react-hooks/exhaustive-deps */
import { getUserColumns } from "../Users/components/columns.tsx";
import { DataTable } from "../components/ui/data-table.tsx";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button.tsx";
import { Label } from "../components/ui/label.tsx";
import { Input } from "../components/ui/input.tsx";
import { BadgePlus, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog.tsx";
import axios from "axios";
import { UserData } from "../Users/components/data.ts";
// import { Badge } from "../components/ui/badge.tsx";

export default function AdminUserPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalItemsCount, setTotalItemsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fetchingInBackground, setFetchingInBackground] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);

  console.log(fetchingInBackground);
  const fetchUsers = useCallback(
    async (showAnimation: boolean = false) => {
      try {
        if (showAnimation) setShowLoadingAnimation(true);
        if (!showAnimation) setShowLoadingAnimation(false);

        const queryParams = new URLSearchParams();

        queryParams.append("limit", itemsPerPage.toString());
        queryParams.append(
          "offset",
          (itemsPerPage * (currentPage - 1)).toString()
        );
        queryParams.append("withCount", "true");
        queryParams.append("orderBy", JSON.stringify({ created_at: "desc" }));

        const response = await axios.get(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/v1/getAllUser?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        const data = await response.data;
        console.log(data.data);
        setUsers(data.data);

        setTotalItemsCount(data.totalCount);
        setFetchingInBackground(true);
      } catch (error) {
        toast.error("Error", {
          description: "Failed to fetch users, please try again!",
          action: {
            label: "Close",
            onClick: () => console.log("Close"),
          },
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

  // Modified onAction function in AdminUserPanel.tsx
  const onAction = useCallback(
    async (
      userData: Partial<UserData & { password?: string }>,
      action: "update" | "delete" | "toggle" | "toggleApp" | "toggleWeb",
      setShowLoadingSpinner: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      try {
        if (action === "delete") {
          await axios.delete(
            `${import.meta.env.VITE_BASE_URL}/api/v1/user/${userData.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          setUsers((prevUsers) =>
            prevUsers.filter((prevUser) => prevUser.id !== userData.id)
          );
        } else if (action === "toggle") {
          // Handle status toggle action
          const payload = { status: userData.status };
          await axios.patch(
            `${import.meta.env.VITE_BASE_URL}/api/v1/user/${ userData.id }/status`,
            JSON.stringify(payload),
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
              },
            }
          );
          fetchUsers(false);
        } else if (action === "toggleApp") {
          // Handle app access toggle
          const payload = { app_access: userData.app_access };
          await axios.patch(
            `${import.meta.env.VITE_BASE_URL}/api/v1/user/${ userData.id }/app-access`,
            JSON.stringify(payload),
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
              },
            }
          );
          fetchUsers(false);
        } else if (action === "toggleWeb") {
          // Handle web access toggle
          const payload = { web_access: userData.web_access };
          await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/v1/user/${userData.id}/web-access`,
            JSON.stringify(payload),
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
              },
            }
          );
          fetchUsers(false);
        } else {
          const payload: {
            name: string | undefined;
            email?: string | null;
            phone: string | undefined;
            role: string | undefined;
            password?: string;
            web_access?: boolean;
            app_access?: boolean;
            permissions?: {
              app: string[];
              web: string[];
            };
          } = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone?.toString(),
            role: userData.role,
            web_access: userData.web_access,
            app_access: userData.app_access,
            permissions: userData.permissions,
          };
          if (userData.password) payload["password"] = userData.password;
          await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/v1/user/${userData.id}`,
            JSON.stringify(payload),
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                "Content-Type": "application/json",
              },
            }
          );
          fetchUsers(false);
        }

        // Customize success message based on action
        let successMessage = "User action completed successfully";
        if (action === "toggle")
          successMessage = "User status updated successfully";
        if (action === "toggleApp")
          successMessage = "App access updated successfully";
        if (action === "toggleWeb")
          successMessage = "Web access updated successfully";
        if (action === "delete") successMessage = "User deleted successfully";
        if (action === "update") successMessage = "User updated successfully";

        toast.success("Success", {
          description: successMessage,
          action: {
            label: "Close",
            onClick: () => console.log("Close"),
          },
        });
      } catch (err) {
        console.log(err);

        if (axios.isAxiosError(err) && err.response) {
          const errorMessage =
            err.response.data?.details?.[0]?.message || "Something went wrong.";

          toast.error("Error", {
            description: errorMessage,
            action: {
              label: "Close",
              onClick: () => console.log("Close"),
            },
          });
        } else {
          toast.error("Error", {
            description: "An unexpected error occurred.",
            action: {
              label: "Close",
              onClick: () => console.log("Close"),
            },
          });
        }
      } finally {
        setShowLoadingSpinner(false);
      }
    },
    []
  );

  const columns = useMemo(() => getUserColumns({ onAction }), []);
  
  return (
    <>
      {showCreateUserDialog && (
        <CreateUserDialog
          setShowCreateUserDialog={setShowCreateUserDialog}
          fetchUsers={fetchUsers}
        />
      )}

      <div className="flex items-start justify-between pb-4">
        <div></div>
        <div className="flex items-center justify-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            className="mt-1 border-gray-300"
            onClick={() => setShowCreateUserDialog(true)}
          >
            <BadgePlus className="scale-90" /> User
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="mt-1 border-gray-300"
            onClick={() => fetchUsers(true)}
          >
            <RefreshCcw className="scale-90" />
          </Button>
        </div>
      </div>
      <DataTable
        data={users}
        columns={columns}
        isLoading={showLoadingAnimation}
        totalItemsCount={totalItemsCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
      />
    </>
  );
}

function CreateUserDialog({
  setShowCreateUserDialog,
  fetchUsers,
}: {
  fetchUsers: (showAnimation: boolean) => void;
  setShowCreateUserDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  // const [selectedSites, setSelectedSites] = useState<string[]>([]);
  // const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   // Fetch available sites
  //   const fetchSites = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${import.meta.env.VITE_BASE_URL}/api/v1/sites`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  //           },
  //         }
  //       );
  //       // setSites(response.data);
  //     } catch (error) {
  //       console.error("Failed to fetch sites:", error);
  //       toast.error("Error", {
  //         description: "Failed to fetch sites",
  //       });
  //     }
  //   };

  //   fetchSites();
  // }, []);

  async function createUser() {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/v1/user`,
        {
          name,
          email,
          phone,
          role,
          // site_ids: selectedSites,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        toast.success("Success", {
          description: "User created successfully",
        });
        setShowCreateUserDialog(false);
        fetchUsers(true);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error", {
        description: "Failed to create user",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => setShowCreateUserDialog(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Add a new user to the system</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              autoFocus={false}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="col-span-3 p-2 border rounded-md"
            >
              <option value="">Select Role</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATIONS">Operations</option>
              {/* <option value="ACCOUNTS">Accounts</option> */}
            </select>
          </div>
          {/* <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sites" className="text-right">
              Sites
            </Label>
            <div className="col-span-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSites.map((siteId) => {
                  const site = sites.find((s) => s.id === siteId);
                  return (
                    <Badge
                      key={siteId}
                      className="bg-blue-100 text-blue-800 px-2 py-1"
                    >
                      {site?.name}
                      <button
                        onClick={() =>
                          setSelectedSites((prev) =>
                            prev.filter((id) => id !== siteId)
                          )
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <select
                id="sites"
                onChange={(e) => {
                  const siteId = e.target.value;
                  if (siteId && !selectedSites.includes(siteId)) {
                    setSelectedSites((prev) => [...prev, siteId]);
                  }
                }}
                className="w-full p-2 border rounded-md"
                value=""
              >
                <option value="">Select Sites</option>
                {sites
                  .filter((site) => !selectedSites.includes(site.id))
                  .map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
              </select>
            </div>
          </div> */}
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={createUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
