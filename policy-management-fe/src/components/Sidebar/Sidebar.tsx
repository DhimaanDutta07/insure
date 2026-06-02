/* eslint-disable react-hooks/exhaustive-deps */
// import React, { useState, JSX, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
// } from "../../components/ui/sheet";
// import {
//   LayoutDashboard,
//   Users,
//   Menu,
//   List,
//   // PersonStanding,
//   Warehouse,
//   MessageSquare,
//   LogOut,
//   ChevronRight,
// } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import Logo from '../../assets/logo-4.png';
// import { useAuth } from '../../Context/AuthContext';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../../components/ui/alert-dialog";

// type SidebarProps = object;

// const Sidebar: React.FC<SidebarProps> = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeItem, setActiveItem] = useState('dashboard');
//   const { user, logout } = useAuth();
//   const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

//   useEffect(() => {
//     const path = location.pathname.split('/').pop() || 'dashboard';
//     setActiveItem(path);
//   }, [location]);

//   const initiateLogout = () => {
//     setShowLogoutConfirmation(true);
//   };

//   const confirmLogout = () => {
//     logout();
//     navigate('/');
//     setShowLogoutConfirmation(false);
//   };

//   const cancelLogout = () => {
//     setShowLogoutConfirmation(false);
//   };

//   // Define all possible menu items with their permission keys
//   const allMenuItems = [
//     { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard', permission: 'Dashboard' },
//     {id:'all-enquiries',name:'Enquiries',icon:<MessageSquare size={20} />,path:'/admin/all-enquiries',permission:'All_Enquiry'},
//     // { id: 'enquiries', name: 'Enquiry Form', icon: <MessageSquare size={20} />, path: '/admin/enquiries', permission: 'Enquiry' },
//     // { id: 'orders', name: 'Purchase Orders', icon: <ClipboardList size={20}  />, path: '/admin/orders', permission: 'Purchase_Order' },
//     { id: 'users', name: 'Users', icon: <Users size={20} />, path: '/admin/users', permission: 'Users_Panel' },
//     // { id: 'materials', name: 'Materials', icon: <Package size={20} />, path: '/admin/materials', permission: 'Material' },
//     { id: 'site', name: 'Sites', icon: <Warehouse size={20} />, path: '/admin/site', permission: 'Site' },
//     // { id: 'vendors', name: 'Vendors', icon: <PersonStanding size={20} />, path: '/admin/vendors', permission: 'Vendor' },
//     { id: 'items', name: 'Items', icon: <List size={20}  />, path: '/admin/items', permission: 'Items' },
//   ];

//   // Filter menu items based on user permissions
//   const menuItems = user?.permissions?.web
//     ? allMenuItems.filter(item => user.permissions?.web.includes(item.permission))
//     : [];

//   interface MenuItem {
//     id: string;
//     name: string;
//     icon: JSX.Element;
//     path: string;
//     permission: string;
//   }

//   const handleNavigation = (item: MenuItem) => {
//     setActiveItem(item.id);
//     navigate(item.path);
//   };

//   const SidebarItem = ({ item, isActive, onClick }: { item: MenuItem; isActive: boolean; onClick: (item: MenuItem) => void }) => {
//     // Clone the icon element with new props
//     const sizedIcon = React.cloneElement(item.icon, {
//       className: `${isActive ? 'text-white' : 'text-gray-400'} transition-all duration-300`,
//       size: 24
//     });

//     return (
//       <Button
//         variant="ghost"
//         className={`
//           w-full flex justify-between items-center py-3 px-5 text-sm font-medium relative group
//           transition-all duration-300 ease-in-out rounded-none
//           ${isActive
//             ? 'text-white transform translate-x-1'
//             : 'text-gray-400 hover:text-white'}
//         `}
//         onClick={() => onClick(item)}
//       >
//         <div className="flex items-center gap-4">
//           <div className='text-inherit'>
//             {/* Increase icon size here */}
//             {React.cloneElement(sizedIcon, { size: 20 })}
//           </div>
//           <span className="text-lg">
//             {item.name}
//           </span>
//         </div>
//         <ChevronRight size={16} className={`${isActive ? 'opacity-100' : 'opacity-0'} text-gray-400`} />
//       </Button>
//     );
//   };

//   const SidebarContent = () => (
//     <div className="flex justify-between h-full flex-col text-white" style={{background:"#192155"}}>
//       <div className="flex-1 overflow-auto">
//         {/* Centered logo with separator line */}
//         <div className="flex flex-col items-center justify-center py-2">
//           <div className="flex justify-center w-full mb-2 mt-2">
//             <img
//               src={Logo}
//               className="max-h-11 object-contain cursor-pointer"
//               alt="Logo"
//             />
//           </div>
//           <div className="w-full h-px bg-gray-600/50"></div>
//         </div>

//         <div className="flex flex-col gap-1 mt-6 space-y-1 px-4">
//           {menuItems.map((item) => (
//             <SidebarItem
//               key={item.id}
//               item={item}
//               isActive={activeItem === item.id}
//               onClick={handleNavigation}
//             />
//           ))}
//         </div>
//       </div>

//       <div className="p-4 border-t border-gray-800/30">
//         {user && (
//           <div className="flex items-center justify-between gap-1">
//             <div className="text-sm font-medium text-gray-400 max-w-[70%] hover:text-white">
//               {user.name}
//             </div>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={initiateLogout}
//               className="text-gray-400 hover:text-white cursor-pointer"
//             >
//               <LogOut className="h-4 w-4" />
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="flex min-h-screen">
//       <div className="hidden md:flex md:w-56 md:flex-col md:inset-y-0 shadow-2xl">
//         <SidebarContent />
//       </div>

//       <Sheet>
//         <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800/50 shadow-lg">
//           <div className="flex items-center space-x-3">
//             <SheetTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="text-white hover:bg-gray-800/50 transition-all duration-200"
//               >
//                 <Menu className="h-5 w-5" />
//               </Button>
//             </SheetTrigger>
//             <h1 className="text-lg font-semibold text-white bg-gray-800/30 px-3 py-1 rounded-lg">
//               {menuItems.find(item => item.id === activeItem)?.name || 'Dashboard'}
//             </h1>
//           </div>
//         </div>
//         <SheetContent side="left" className="p-0 w-72 border-r-0 shadow-xl">
//           <SidebarContent />
//         </SheetContent>
//       </Sheet>

//       {/* Logout Confirmation Dialog */}
//       <AlertDialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to log out?.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel className='cursor-pointer' onClick={cancelLogout}>Cancel</AlertDialogCancel>
//             <AlertDialogAction onClick={confirmLogout}
//             className="text-sm border-none text-white cursor-pointer"
//             style={{background: "#0f50ba"}} >
//               Log out
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// };

// export default Sidebar;

// import React, { useState, JSX, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import {
//   Sheet,
//   SheetContent,
//   SheetTrigger,
// } from "../../components/ui/sheet";
// import {
//   LayoutDashboard,
//   Users,
//   Menu,
//   List,
//   // PersonStanding,
//   Warehouse,
//   MessageSquare,
//   LogOut,
//   ChevronRight,
//   Package,
// } from "lucide-react";
// import { Button } from "../../components/ui/button";
// import Logo from '../../assets/logo-4.png';
// import { useAuth } from '../../Context/AuthContext';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../../components/ui/alert-dialog";

// type SidebarProps = object;

// const Sidebar: React.FC<SidebarProps> = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [activeItem, setActiveItem] = useState('dashboard');
//   const { user, logout } = useAuth();
//   const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
//   const [isDrawerOpen, setIsDrawerOpen] = useState(false);

//   useEffect(() => {
//     const path = location.pathname.split('/').pop() || 'dashboard';
//     setActiveItem(path);
//   }, [location]);

//   // Handle window resize events to adjust UI
//   useEffect(() => {
//     const handleResize = () => {
//       // Close drawer automatically when resizing to desktop view
//       if (window.innerWidth >= 768 && isDrawerOpen) {
//         setIsDrawerOpen(false);
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, [isDrawerOpen]);

//   const initiateLogout = () => {
//     setShowLogoutConfirmation(true);
//   };

//   const confirmLogout = () => {
//     logout();
//     navigate('/');
//     setShowLogoutConfirmation(false);
//   };

//   const cancelLogout = () => {
//     setShowLogoutConfirmation(false);
//   };

//   // Define all possible menu items with their permission keys
//   // const allMenuItems = [
//   //   { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard', permission: 'Dashboard' },
//   //   {id:'all-enquiries',name:'Enquiries',icon:<MessageSquare size={20} />,path:'/admin/all-enquiries',permission:'All_Enquiry'},
//   //   // { id: 'enquiries', name: 'Enquiry Form', icon: <MessageSquare size={20} />, path: '/admin/enquiries', permission: 'Enquiry' },
//   //   // { id: 'orders', name: 'Purchase Orders', icon: <ClipboardList size={20}  />, path: '/admin/orders', permission: 'Purchase_Order' },
//   //   { id: 'users', name: 'Users', icon: <Users size={20} />, path: '/admin/users', permission: 'Users_Panel' },
//   //   // { id: 'materials', name: 'Materials', icon: <Package size={20} />, path: '/admin/materials', permission: 'Material' },
//   //   { id: 'site', name: 'Sites', icon: <Warehouse size={20} />, path: '/admin/site', permission: 'Site' },
//   //   // { id: 'vendors', name: 'Vendors', icon: <PersonStanding size={20} />, path: '/admin/vendors', permission: 'Vendor' },
//   //   { id: 'items', name: 'Items', icon: <List size={20}  />, path: '/admin/items', permission: 'Items' },
//   // ];
//   const allMenuItems = [
//     { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard', permission: 'Dashboard' },
//     { id: 'all-enquiries', name: 'Enquiries', icon: <MessageSquare size={20} />, path: '/admin/all-enquiries', permission: 'All_Enquiry' },
//     { id: 'users', name: 'Users', icon: <Users size={20} />, path: '/admin/users', permission: 'Users_Panel' },

//     {
//       id: 'master',
//       name: 'Master',
//       icon: <Package size={20} />,
//       permission: 'Master',
//       children: [
//         { id: 'site', name: 'Sites', icon: <Warehouse size={20} />, path: '/admin/site', permission: 'Site' },
//         { id: 'items', name: 'Items', icon: <List size={20} />, path: '/admin/items', permission: 'Items' }
//       ]
//     }
//   ];

//   // Filter menu items based on user permissions
//   const menuItems = user?.permissions?.web
//     ? allMenuItems.filter(item => user.permissions?.web.includes(item.permission))
//     : [];

//   interface MenuItem {
//     id: string;
//     name: string;
//     icon: JSX.Element;
//     path?: string; // Make path optional
//     permission: string;
//     children?: MenuItem[]; // Add children property for nested menu items
//   }

//   const handleNavigation = (item: MenuItem) => {
//     setActiveItem(item.id);
//     if (item.path) {
//       navigate(item.path);
//     }

//     // Close mobile drawer after navigation
//     if (window.innerWidth < 768) {
//       setIsDrawerOpen(false);
//     }
//   };

//   const SidebarItem = ({ item, isActive, onClick }: { item: MenuItem; isActive: boolean; onClick: (item: MenuItem) => void }) => {
//     // Clone the icon element with new props
//     const sizedIcon = React.cloneElement(item.icon, {
//       className: `${isActive ? 'text-white' : 'text-gray-400'} transition-all duration-300`,
//       size: 24
//     });

//     return (
//       <Button
//         variant="ghost"
//         className={`
//           w-full flex justify-between items-center py-3 px-4 sm:px-5 text-sm font-medium relative group
//           transition-all duration-300 ease-in-out rounded-none
//           ${isActive
//             ? 'text-white transform translate-x-1'
//             : 'text-gray-400 hover:text-white'}
//         `}
//         onClick={() => onClick(item)}
//       >
//         <div className="flex items-center gap-3 sm:gap-4">
//           <div className='text-inherit'>
//             {React.cloneElement(sizedIcon, { size: 20 })}
//           </div>
//           <span className="text-base sm:text-lg truncate">
//             {item.name}
//           </span>
//         </div>
//         <ChevronRight size={16} className={`${isActive ? 'opacity-100' : 'opacity-0'} text-gray-400`} />
//       </Button>
//     );
//   };

//   const SidebarContent = () => (
//     <div className="flex justify-between h-full flex-col text-white" style={{background:"#192155"}}>
//       <div className="flex-1 overflow-auto">
//         {/* Centered logo with separator line */}
//         <div className="flex flex-col items-center justify-center py-2">
//           <div className="flex justify-center w-full mb-2 mt-2">
//             <img
//               src={Logo}
//               className="max-h-10 sm:max-h-11 object-contain cursor-pointer"
//               alt="Logo"
//               onClick={() => navigate('/admin/dashboard')}
//             />
//           </div>
//           <div className="w-full h-px bg-gray-600/50"></div>
//         </div>

//         <div className="flex flex-col gap-1 mt-4 sm:mt-6 space-y-1 px-2 sm:px-4">
//           {menuItems.map((item) => (
//             <SidebarItem
//               key={item.id}
//               item={item}
//               isActive={activeItem === item.id}
//               onClick={handleNavigation}
//             />
//           ))}
//         </div>
//       </div>

//       <div className="p-3 sm:p-4 border-t border-gray-800/30">
//         {user && (
//           <div className="flex items-center justify-between gap-1">
//             <div className="text-xs sm:text-sm font-medium text-gray-400 max-w-[70%] truncate hover:text-white">
//               {user.name}
//             </div>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={initiateLogout}
//               className="text-gray-400 hover:text-white cursor-pointer"
//             >
//               <LogOut className="h-4 w-4" />
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <>
//       {/* Desktop and Tablet Sidebar (md and up) - Fixed position */}
//       <div className="hidden md:block fixed left-0 top-0 h-screen md:w-48 lg:w-56 shadow-2xl z-30">
//         <SidebarContent />
//       </div>

//       {/* Mobile Header and Sidebar */}
//       <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-3 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800/50 shadow-lg h-14">
//         <div className="flex items-center space-x-2 sm:space-x-3">
//           {/* Make sure SheetTrigger is nested within Sheet */}
//           <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
//             <SheetTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="text-white hover:bg-gray-800/50 transition-all duration-200"
//               >
//                 <Menu className="h-5 w-5" />
//               </Button>
//             </SheetTrigger>
//             <SheetContent
//               side="left"
//               className="p-0 w-64 sm:w-72 border-r-0 shadow-xl"
//             >
//               <SidebarContent />
//             </SheetContent>
//           </Sheet>
//           <h1 className="text-base sm:text-lg font-semibold text-white bg-gray-800/30 px-2 sm:px-3 py-1 rounded-lg truncate max-w-[200px] sm:max-w-[300px]">
//             {menuItems.find(item => item.id === activeItem)?.name || 'Dashboard'}
//           </h1>
//         </div>
//       </div>

//       {/* Main Content Container - With proper padding/margin to account for sidebar */}
//       <div className="flex flex-col w-full md:pl-48 lg:pl-56">
//         {/* Mobile top spacing to account for fixed header */}
//         <div className="md:hidden h-14"></div>
//       </div>

//       {/* Logout Confirmation Dialog */}
//       <AlertDialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
//         <AlertDialogContent className="sm:max-w-md">
//           <AlertDialogHeader>
//             <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to log out?
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter className="sm:justify-end">
//             <AlertDialogCancel className='cursor-pointer' onClick={cancelLogout}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={confirmLogout}
//               className="text-sm border-none text-white cursor-pointer"
//               style={{background: "#0f50ba"}}
//             >
//               Log out
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// };

// export default Sidebar;

import React, { useState, JSX, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Menu,
  MessageSquare,
  LogOut,
  ChevronRight,
  ChevronDown,
  // UserCheck,
  // DollarSign,
  // FileText,
  // FolderOpen,
  // Building,
  // Settings,
  // Package,
  // IndianRupee,
  BadgeIndianRupeeIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Logo from "../../assets/GeneralPolicy.png";
import { useAuth } from "../../Context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

type SidebarProps = object;

const Sidebar: React.FC<SidebarProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState("dashboard");
  const { user, logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]); // Track expanded menu items
 
  useEffect(() => {
    const path = location.pathname;
    let newActive: string;
    if (path.includes("/admin/policies") || path.includes("/admin/all-policies")) {
      newActive = "all-policies";
    } else {
      newActive = path.split("/").pop() || "dashboard";
    }
    setActiveItem((prev) => (prev !== newActive ? newActive : prev));
    const parentId = findParentId(newActive);
    if (parentId && !expandedItems.includes(parentId)) {
      setExpandedItems((prev) => [...prev, parentId]);
    }
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDrawerOpen]);

  const initiateLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/");
    setShowLogoutConfirmation(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const allMenuItems = [
    {
      id: "policydashboard",
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/policydashboard",
      permission: "Dashboard",
    },
    {
      id: "all-policies",
      name: "Policy",
      icon: <MessageSquare size={20} />,
      path: "/admin/all-policies",
      permission: "All_Policy",
    },
    // {
    //   id: "all-enquiries",
    //   name: "Enquiry",
    //   icon: <MessageSquare size={20} />,
    //   path: "/admin/all-enquiries",
    //   permission: "All_Enquiry",
    // },
        //     {
        //   id: "agents",
        //   name: "Agents",
        //   icon: <UserCheck size={20} />,
        //   path: "/admin/agents",
        //   permission: "Agent",
        // },
        {
          id: "commission",
          name: "Commission",
          icon: <BadgeIndianRupeeIcon size={20} />,
          path: "/admin/commission",
          permission: "Commission",
        },
    // {
    //   id: "master",
    //   name: "Master",
    //   icon: <Package size={20} />,
    //   permission: "Master",
    //   children: [
    //     {
    //       id: "agents",
    //       name: "Agents",
    //       icon: <UserCheck size={20} />,
    //       path: "/admin/agents",
    //       permission: "Agent",
    //     },
    //     {
    //       id: "commission",
    //       name: "Commission",
    //       icon: <DollarSign size={20} />,
    //       path: "/admin/commission",
    //       permission: "Commission",
    //     },
    //     {
    //       id: "policy-types",
    //       name: "Policy Types",
    //       icon: <FileText size={20} />,
    //       path: "/admin/policy-types",
    //       permission: "PolicyType",
    //     },
    //     {
    //       id: "policy-groups",
    //       name: "Policy Groups",
    //       icon: <FolderOpen size={20} />,
    //       path: "/admin/policy-groups",
    //       permission: "PolicyGroup",
    //     },
    //     {
    //       id: "policy-names",
    //       name: "Policy Names",
    //       icon: <FileText size={20} />,
    //       path: "/admin/policy-names",
    //       permission: "PolicyName",
    //     },
    //     {
    //       id: "companies",
    //       name: "Companies",
    //       icon: <Building size={20} />,
    //       path: "/admin/companies",
    //       permission: "Company",
    //     },
    //     {
    //       id: "company-form-fields",
    //       name: "Company Fields",
    //       icon: <Settings size={20} />,
    //       path: "/admin/company-form-fields",
    //       permission: "CompanyFormField",
    //     },
    //     {
    //       id: "revenues",
    //       name: "Revenues",
    //       icon: <DollarSign size={20} />,
    //       path: "/admin/revenues",
    //       permission: "Revenues",
    //     },
    // ],
    //  },

    // {
    //   id: "revenues",
    //   name: "Revenues",
    //   icon: <IndianRupee size={20} />,
    //   path: "/admin/revenues",
    //   permission: "Revenues",
    // },
    {
      id: "users",
      name: "Users",
      icon: <Users size={20} />,
      path: "/admin/users",
      permission: "Users_Panel",
    },
  ];

  // Filter menu items based on permissions, including nested children
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!user?.permissions?.web) return [];
    
    return items.filter((item) => {
      // Check if user has permission for this item
      const hasPermission = user.permissions?.web.includes(item.permission);
      
      // If item has children, filter them recursively
      if (item.children) {
        const filteredChildren = item.children.filter((child) =>
          user.permissions?.web.includes(child.permission)
        );
        
        // Show parent if it has permission OR if it has any visible children
        if (hasPermission || filteredChildren.length > 0) {
          return {
            ...item,
            children: filteredChildren
          };
        }
        return false;
      }
      
      return hasPermission;
    }).map((item) => {
      // Ensure children are properly filtered
      if (item.children) {
        return {
          ...item,
          children: item.children.filter((child) =>
            user.permissions?.web.includes(child.permission)
          )
        };
      }
      return item;
    });
  };

  const menuItems = filterMenuItems(allMenuItems);

  interface MenuItem {
    id: string;
    name: string;
    icon: JSX.Element;
    path?: string;
    permission: string;
    children?: MenuItem[];
  }

  // Helper function to find the parent ID of an item
  const findParentId = (itemId: string): string | null => {
    for (const item of allMenuItems) {
      if ('children' in item && Array.isArray((item as unknown as { children?: unknown[] }).children)) {
        const children = (item as unknown as { children?: unknown[] }).children;
        if (children && children.some((child: unknown) => typeof child === 'object' && child !== null && 'id' in child && (child as { id: string }).id === itemId)) {
          return item.id;
        }
      }
    }
    return null;
  };

  const handleNavigation = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      if (window.innerWidth < 768) {
        setIsDrawerOpen(false);
      }
      return;
    }
    if (item.children) {
      setExpandedItems((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    }
  };

  const SidebarItem = ({
    item,
    isActive,
    onClick,
    level = 0,
  }: {
    item: MenuItem;
    isActive: boolean;
    onClick: (item: MenuItem) => void;
    level?: number;
  }) => {
    const sizedIcon = React.cloneElement(item.icon, {
      className: `${
        isActive ? "text-white" : "text-gray-400"
      } transition-all duration-300`,
      size: 20,
    });
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = !!item.children;

    return (
      <>
        <Button
          variant="ghost"
          className={`
            w-full flex justify-between items-center py-2 px-4 sm:px-5 text-sm font-medium relative group
            transition-all duration-300 ease-in-out rounded-none
            ${
              isActive
                ? "text-white transform translate-x-1"
                : "text-gray-400 hover:text-white"
            } 
          `}
          style={{ paddingLeft: `${level * 0.75 + 0.25}rem` }} // Indent nested items
          onClick={() => onClick(item)}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-inherit">{sizedIcon}</div>
            <span className="text-base sm:text-lg truncate">{item.name}</span>
          </div>
          {hasChildren && (
            <ChevronDown
              size={16}
              className={`${
                isExpanded ? "rotate-180" : ""
              } text-gray-400 transition-transform duration-200`}
            />
          )}
          {!hasChildren && (
            <ChevronRight
              size={16}
              className={`${
                isActive ? "opacity-100" : "opacity-0"
              } text-gray-400`}
            />
          )}
        </Button>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {item.children!.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                isActive={activeItem === child.id}
                onClick={onClick}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  const SidebarContent = () => (
    <div
      className="flex justify-between h-full flex-col text-white"
      style={{ background: "#192155" }}
    >
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col items-center justify-center py-2">
          <div className="flex justify-center w-full mb-2 mt-2">
            <img
              src={Logo}
              className="max-h-11 sm:max-h-11 w-45 cursor-pointer"
              alt="Logo"
              onClick={() => navigate("/admin/policydashboard")}
            />
          </div>
          <div className="w-full h-px bg-gray-600/50"></div>
        </div>

        <div className="flex flex-col gap-1 mt-4 sm:mt-6 space-y-1 px-2 sm:px-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItem === item.id}
              onClick={handleNavigation}
            />
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 border-t border-gray-800/30">
        {user && (
          <div className="flex items-center justify-between gap-1">
            <div className="text-xs sm:text-sm font-medium text-gray-400 max-w-[70%] truncate hover:text-white">
              {user.name}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={initiateLogout}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block fixed left-0 top-0 h-screen md:w-48 lg:w-56 shadow-2xl z-30">
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-3 bg-gradient-to-r from-gray-900 to-black border-b border-gray-800/50 shadow-lg h-14">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-64 sm:w-72 border-r-0 shadow-xl"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <h1 className="text-base sm:text-lg font-semibold text-white bg-gray-800/30 px-2 sm:px-3 py-1 rounded-lg truncate max-w-[200px] sm:max-w-[300px]">
            {menuItems.find((item) => item.id === activeItem)?.name ||
              "Dashboard"}
          </h1>
        </div>
      </div>

      <div className="flex flex-col w-full md:pl-48 lg:pl-56">
        <div className="md:hidden h-14"></div>
      </div>

      <AlertDialog
        open={showLogoutConfirmation}
        onOpenChange={setShowLogoutConfirmation}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-end">
            <AlertDialogCancel
              className="cursor-pointer"
              onClick={cancelLogout}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="text-sm border-none text-white cursor-pointer"
              style={{ background: "#0f50ba" }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Sidebar;
