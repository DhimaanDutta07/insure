// import React from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "../ui/dialog";
// import { Button } from "../ui/button";

// interface DeleteConfirmationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
// }

// const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
//   isOpen,
//   onClose,
//   onConfirm,
// }) => {
//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="bg-white max-w-md">
//         <DialogHeader>
//           <DialogTitle className="text-left">
//             Are you absolutely sure?
//           </DialogTitle>
//         </DialogHeader>
//         <div className="py-3">
//           <p >
//           Are you sure you want to delete this PO? 
//           </p>
//         </div>
//         <DialogFooter className="flex justify-end gap-2 sm:justify-end">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={onClose}
//             className="border-gray-300"
//           >
//             Cancel
//           </Button>
//           <Button
//             type="button"
//             onClick={onConfirm}
//             style={{ background: "#0f50ba" }}
//             className=" text-white"
//           >
//             Continue
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default DeleteConfirmationModal;