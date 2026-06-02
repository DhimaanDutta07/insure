// import { ColumnDef } from "@tanstack/react-table";
// import { UserData } from "./data";
// import { Badge } from "../../components/ui/badge";
// import { Switch } from "../../components/ui/switch";
// import { DataTableRowActions } from "./data-table-row-actions";

// interface GetUserColumnsProps {
//   onAction: (user: UserData, action: "update" | "delete" | "toggle" | "toggleApp" | "toggleWeb", setShowLoadingSpinner: React.Dispatch<React.SetStateAction<boolean>>) => void;
// }
// console.log()
// export const getUserColumns = ({ onAction }: GetUserColumnsProps): ColumnDef<UserData>[] => [
//   {
//     accessorKey: "name",
//     header: () => <div className="text-left w-8">Name</div>,
//     cell: ({ row }) => <div>{row.getValue("name")}</div>,
//     maxSize: 40,
//   },
//   {
//     accessorKey: "phone",
//     header: () => <div className="text-left w-8">Phone</div>,
//     cell: ({ row }) => <div>{row.getValue("phone")}</div>,
//     maxSize: 5
//   },
//   // {
//   //   accessorKey: "email",
//   //   header: () => <div className="text-left w-38">Email</div>,
//   //   cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
//   //   maxSize: 30
//   // },
//   {
//     accessorKey: "sites",
//     header: () => <div className="text-left w-50">Sites</div>,
//     cell: ({ row }) => {
//       const sites = row.original.sites || [];
//       return (
//         <div className="flex flex-wrap gap-1">
//           {sites.length > 0 ? (
//             sites.map((site) => (
//               <Badge key={site.id} variant="outline" className="text-sm">
//                 {site.name}
//               </Badge>
//             ))
//           ) : (
//             <span className="text-sm text-muted-foreground">No sites assigned</span>
//           )}
//         </div>
//       );
//     },
//     maxSize: 30
//   },
//   {
//     accessorKey: "role",
//     header: () => <div className="text-left w-2">Role</div>,
//     cell: ({ row }) => {
//       let role = row.getValue("role") as string;
//        const backgroundColorClass = role === "ADMIN" ? "bg-amber-300" : "bg-blue-300";
//        role = role.toLowerCase().replace("_", " ");
//        return (
//         <Badge
//            className={`${backgroundColorClass} px-2 py-1 text-white capitalize whitespace-nowrap text-[14px]`}
//          >
//           {role}
//         </Badge>
//       );
//     },
//     maxSize: 50,
//   },
//   {
//     accessorKey: "status",
//     header: () => <div className="text-left w-2">Status</div>,
//     cell: ({ row }) => {
//       const user = row.original;
//       const isActive = user.status === "Active";

//       const handleToggle = async (checked: boolean) => {
//         const newStatus = checked ? "Active" : "Inactive";
//         onAction({ ...user, status: newStatus }, "toggle", () => {});
//       };

//       return (
//         <div className="">
//            <Switch
//              checked={isActive}
//              onCheckedChange={handleToggle}
//              aria-label="Toggle user active status"
//            />
//          </div>
//       );
//     },
//     maxSize: 5,
//   },
//   {
//     id: "actions",
//     header: () => <div className="text-left w-2">Action</div>,
//      cell: ({ row }) => (
//        <div className="flex justify-start">
//          <DataTableRowActions row={row} columnName="edit" onAction={onAction} />
//          {/* <DataTableRowActions row={row} columnName="delete" onAction={onAction} /> */}
//        </div>
//      ),
//      maxSize: 10,
//   },
// ];


// In your column.tsx file:
import { ColumnDef } from "@tanstack/react-table";
import { UserData } from "./data";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { DataTableRowActions } from "./data-table-row-actions";

interface GetUserColumnsProps {
  onAction: (user: UserData, action: "update" | "delete" | "toggle" | "toggleApp" | "toggleWeb", setShowLoadingSpinner: React.Dispatch<React.SetStateAction<boolean>>) => void;
  readOnly?: boolean;
}

export const getUserColumns = ({ onAction, readOnly = false }: GetUserColumnsProps): ColumnDef<UserData>[] => [
  {
    accessorKey: "name",
    header: () => <div className={`text-left ${readOnly ? "w-1/2" : ""}`}>Name</div>,
    cell: ({ row }) => <div className={`truncate ${readOnly ? "w-full" : ""}`}>{row.getValue("name")}</div>,
    size: readOnly ? 300 : 120, // Wider when read-only (operations) so it takes half space
  },
  {
    accessorKey: "phone",
    header: () => <div className={`text-left ${readOnly ? "w-1/2" : ""}`}>Phone</div>,
    cell: ({ row }) => <div className={`truncate ${readOnly ? "w-full" : ""}`}>{row.getValue("phone")}</div>,
    size: readOnly ? 300 : 90,
  },
  // {
  //   accessorKey: "sites",
  //   header: () => <div className="text-left">Sites</div>,
  //   cell: ({ row }) => {
  //     const sites = row.original.sites || [];
  //     return (
  //       <div className="flex flex-wrap gap-1 max-w-[800px]">
  //         {sites.length > 0 ? (
  //           sites.map((site) => (
  //             <Badge key={site.id} variant="outline" className="text-sm truncate font-normal border border-gray-300 text-gray-500">
  //               {site.name}
  //             </Badge>
  //           ))
  //         ) : (
  //           <span className="text-sm text-muted-foreground">No sites assigned</span>
  //         )}
  //       </div>
  //     );
  //   },
  //   size: 450
  // },
  {
    accessorKey: "role",
    header: () => <div className={`text-left pl-3 ${readOnly ? "invisible" : ""}`}>Role</div>,
    cell: ({ row }) => {
      let role = row.getValue("role") as string;
      const backgroundColorClass = role === "ADMIN" ? "bg-yellow-300" : "bg-blue-300";
      role = role.toLowerCase().replace("_", " ");
      return (
        <Badge
          className={`${backgroundColorClass} px-2  text-white capitalize whitespace-nowrap text-[14px] ${readOnly ? "invisible" : ""}`}
        >
          {role}
        </Badge>
      );
    },
    size: readOnly ? 0 : 50,
  },
  {
    accessorKey: "status",
    header: () => <div className={`text-left ${readOnly ? "invisible" : ""}`}>Status</div>,
    cell: ({ row }) => {
      const user = row.original;
      const isActive = user.status === "Active";

      const handleToggle = async (checked: boolean) => {
        if (readOnly) return;
        const newStatus = checked ? "Active" : "Inactive";
        onAction({ ...user, status: newStatus }, "toggle", () => {});
      };

      return (
        <div>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={readOnly}
            className={readOnly ? "invisible" : undefined}
            aria-label="Toggle user active status"
          />
        </div>
      );
    },
    size: readOnly ? 0 : 80,
  },
  {
    id: "actions",
    header: () => <div className={`text-left ${readOnly ? "invisible" : ""}`}>Action</div>,
    cell: ({ row }) => (
      <div className="flex justify-start">
        {readOnly ? (
          <div className="h-10 w-10 invisible" />
        ) : (
          <DataTableRowActions row={row} columnName="edit" onAction={onAction} readOnly={readOnly} />
        )}
      </div>
    ),
    size: readOnly ? 0 : 80,
  },
];