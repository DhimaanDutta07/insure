/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { Row } from "@tanstack/react-table";
import { Button } from "../../components/ui/button";
import { Edit, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { UserData } from "./data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// import axios from "axios";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  columnName: "edit" | "delete";
  onAction: (
    val: TData,
    action: "delete" | "update",
    setShowLoadingSpinner: React.Dispatch<React.SetStateAction<boolean>>
  ) => void;
  readOnly?: boolean;
}

export function DataTableRowActions<TData>({
  row,
  columnName,
  onAction,
  readOnly = false,
}: DataTableRowActionsProps<TData>) {
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [userData, setUserData] = useState<UserData>(row.original as UserData);
  const [updatedEmail, setUpdatedEmail] = useState<string | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userEmail] = useState(localStorage.getItem("email") as string);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [dialogJustOpened, setDialogJustOpened] = useState(false);
  // Access controls
  // const [appAccess, setAppAccess] = useState(userData.app_access || false);
  const [webAccess, setWebAccess] = useState(userData.web_access || false);

  // Permission states
  const [webPermissions, setWebPermissions] = useState<string[]>(
    userData.permissions?.web || []
  );

  // All permissions checkboxes
  const [allWebPermissions, setAllWebPermissions] = useState(false);

  // All available permissions (for backend)
  const allAvailableWebPermissions = [
    // "Master",
    "Users_Panel",
    // "All_Enquiry",
    "All_Policy",
    "Dashboard",
    // "Items",
    // "Agents",
    // "Site",
    // "Revenues",
    // "Reimbursement",
    // "Commision",
    // "Clients",
    // "Agent",
    "Commission",
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
    "Dashboard",
    // "Agent",
    "Commission",
    // "PolicyType",
    // "PolicyGroup",
    // "PolicyName",
    // "Company",
    // "CompanyFormField",
  ];

  const masterPermissions = ["Items", "Site", "Reimbursement", "Clients","Agents", "Commisons", "Policy Group", "Company"];

  // const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  // const [selectedSites, setSelectedSites] = useState<string[]>(
  //   userData.sites?.map((site) => site.id) || []
  // );

  // Keep "All Web Permissions" checkbox in sync with selected permissions
  useEffect(() => {
    const hasAllPermissions = allAvailableWebPermissions.every((permission) =>
      webPermissions.includes(permission)
    );
    setAllWebPermissions(hasAllPermissions);
  }, [webPermissions]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const sitesRes = await axios.get(
  //         `${import.meta.env.VITE_BASE_URL}/api/v1/sites`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  //           },
  //         }
  //       );
  //       setSites(sitesRes.data);
  //     } catch (err) {
  //       console.error("Error fetching data:", err);
  //     }
  //   };
  //   fetchData();
  // }, []);

  function isEmailValid(updatedEmail: string): boolean {
    if (!updatedEmail) return true; // Allow empty email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(updatedEmail);
  }

  const handleWebPermissionChange = (permission: string) => {
    let updatedPermissions: string[] = [];
    
    if (permission === "Master") {
      if (webPermissions.includes("Master")) {
        // Remove Master and all associated permissions
        updatedPermissions = webPermissions.filter(
          (p) => p !== "Master" && !masterPermissions.includes(p)
        );
        setAllWebPermissions(false);
      } else {
        // Add Master and all associated permissions
        updatedPermissions = [
          ...webPermissions.filter((p) => !masterPermissions.includes(p)),
          "Master",
          ...masterPermissions,
        ];
        if (updatedPermissions.length === allAvailableWebPermissions.length) {
          setAllWebPermissions(true);
        }
      }
    } else {
      if (webPermissions.includes(permission)) {
        updatedPermissions = webPermissions.filter(
          (p) => p !== permission
        );
        // If Master was checked, uncheck it when any permission is removed
        if (updatedPermissions.includes("Master")) {
          updatedPermissions = updatedPermissions.filter((p) => p !== "Master");
        }
        setAllWebPermissions(false);
      } else {
        updatedPermissions = [...webPermissions, permission];
        const hasAllPermissions = allAvailableWebPermissions.every((perm) =>
          updatedPermissions.includes(perm)
        );
        if (hasAllPermissions) {
          setAllWebPermissions(true);
        }
      }
    }
    
    // Update permissions state
    setWebPermissions(updatedPermissions);
    
    // Update webAccess based on the updated permissions
    setWebAccess(updatedPermissions.length > 0);
    
    console.log("Permission change:", {
      permission,
      oldPermissions: webPermissions,
      newPermissions: updatedPermissions,
      webAccess: updatedPermissions.length > 0
    });
  };

  async function handleUpdate() {
    // Only validate email if it's not empty and not undefined
    if (updatedEmail !== undefined && updatedEmail !== "" && !isEmailValid(updatedEmail)) return;

    const payload: UserData = { ...userData };
    if (updatedEmail !== undefined) {
      payload.email = updatedEmail === "" ? null : updatedEmail;
    }

    // Update permissions and access in payload
    // payload.app_access = appAccess;
    payload.web_access = webAccess;
    payload.permissions = {
      app: [],
      web: webAccess ? webPermissions : [],
    };
    
    // console.log("Update payload:", {
    //   webAccess,
    //   webPermissions,
    //   finalPermissions: payload.permissions
    // });

    // // Update sites in payload
    // payload.sites = selectedSites.map((siteId) => ({
    //   id: siteId,
    //   name: sites.find((s) => s.id === siteId)?.name || "",
    //   description: null,
    // }));

    try {
      await onAction(payload as TData, "update", setShowLoadingSpinner);
      // Only close modal on success
      setIsDialogOpen(false);
    } catch (error) {
      // Don't close modal on error - let the user see the error and fix it
      console.log("Update failed, keeping modal open:", error);
    }
  }

  useEffect(() => {
    if (!isDialogOpen) {
      setShowLoadingSpinner(false);
    }
  }, [isDialogOpen]);

  // Reset email state and focus hidden input when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Reset updatedEmail to undefined so it shows the current user's email
      setUpdatedEmail(undefined);
      
      // Reset permissions to current user's permissions
      setWebPermissions(userData.permissions?.web || []);
      setWebAccess(userData.web_access || false);
      
      setDialogJustOpened(true);
      
      if (hiddenInputRef.current) {
        // Multiple attempts to ensure focus
        const focusHiddenInput = () => {
          hiddenInputRef.current?.focus();
        };
        
        // Immediate focus
        focusHiddenInput();
        
        // Focus after a short delay
        setTimeout(focusHiddenInput, 10);
        
        // Focus after animation frame
        requestAnimationFrame(() => {
          setTimeout(focusHiddenInput, 50);
        });
      }
      
      // Reset the flag after a delay
      setTimeout(() => {
        setDialogJustOpened(false);
      }, 100);
    }
  }, [isDialogOpen, userData.permissions?.web, userData.web_access]);

  const { email } = row.original as UserData;
  const myRow = Boolean(email && userEmail && email === userEmail);

  if (columnName === "edit") {
    return (
      <div className="flex justify-center items-center">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-black rounded-md  hover:text-blue-800 hover:bg-blue-50"
              disabled={readOnly}
              onClick={() => {
                if (readOnly) return;
                setShowLoadingSpinner(true);
                setIsDialogOpen(true);
              }}
            >
              {showLoadingSpinner ? (
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <Edit size={20} strokeWidth={1.75} />
              )}
            </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white gap-2">
            {/* Hidden input field to capture focus */}
            <input
              ref={hiddenInputRef}
              type="text"
              className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
              tabIndex={0}
              autoFocus
              readOnly
            />
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-left">
                Edit User
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-left">
                  Name
                </Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData({ ...userData, name: e.target.value })
                  }
                  className="col-span-3"
                  disabled={readOnly}
                  tabIndex={dialogJustOpened ? -1 : 1}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-left">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={userData.phone}
                  onChange={(e) =>
                    setUserData({ ...userData, phone: e.target.value })
                  }
                  className="col-span-3"
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-left">
                  Role
                </Label>
                <Select
                  value={userData.role}
                  onValueChange={(value) =>
                    setUserData({ ...userData, role: value })
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="OPERATIONS">Operations</SelectItem>
                    {/* <SelectItem value="ACCOUNTS">Accounts</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sites" className="text-left">
                  Sites
                </Label>
                <div className="col-span-3">
                  <Select
                    value={selectedSites[0] || ""}
                    onValueChange={(value) => {
                      const newSites = selectedSites.includes(value)
                        ? selectedSites.filter((id) => id !== value)
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
                          {site.name}{" "}
                          {selectedSites.includes(site.id) ? "(Selected)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSites.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSites.map((siteId) => {
                        const site = sites.find((s) => s.id === siteId);
                        return site ? (
                          <div
                            key={site.id}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
                          >
                            {site.name}
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSites((prev) =>
                                  prev.filter((id) => id !== site.id)
                                )
                              }
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-left">
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  value={updatedEmail !== undefined ? updatedEmail : (userData.email || "")}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  placeholder="Enter email (optional)"
                  className="col-span-3"
                  disabled={readOnly}
                />
              </div>
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
                      <Label
                        htmlFor="appAccess"
                        className="ml-2 cursor-pointer text-sm font-medium"
                      >
                        App Access
                      </Label>
                    </div>
                  </div>
                </div> */}

                {/* Web Permissions Section */}
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
                            setWebAccess(false);
                          } else {
                            setWebPermissions([...allAvailableWebPermissions]);
                            setAllWebPermissions(true);
                            setWebAccess(true);
                          }
                        }}
                        className="peer h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={readOnly}
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
                            onChange={() =>
                              handleWebPermissionChange(permission)
                            }
                            className="peer h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={readOnly}
                          />
                          <Label
                            htmlFor={`web-${permission}`}
                            className="ml-2 cursor-pointer text-sm text-gray-700"
                          >
                            {permission.replace(/_/g, " ")}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              {!readOnly && (
                <Button
                  onClick={handleUpdate}
                  className="bg-blue-500 hover:bg-blue-600 border border-blue-700 text-white"
                >
                  Save changes
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (columnName === "delete") {
    return (
      <div className="flex justify-center items-center">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-black rounded-md hover:text-red-800 hover:bg-red-50"
              disabled={myRow}
            >
              <Trash2 size={20} strokeWidth={1.75} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                user and remove their data from servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  onAction(
                    row.original as TData,
                    "delete",
                    setShowLoadingSpinner
                  )
                }
                className="text-white"
                style={{ background: "#D11A2A" }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null;
}
