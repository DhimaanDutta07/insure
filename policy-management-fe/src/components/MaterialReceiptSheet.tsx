import { useEffect, useState } from "react";
import { MaterialReceipt } from "../types/materialReceipt";
// import axios from "axios";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Download } from "lucide-react";
import { formatDate } from "./dateFormatter";

export const MaterialReceiptSheet: React.FC<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedReceipt: MaterialReceipt | null;
  }> = ({ open, onOpenChange, selectedReceipt }) => {
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [sheetFormData, setSheetFormData] = useState({
      inward_number: selectedReceipt?.inward_number || "",
      remark: selectedReceipt?.remark || "",
      images: [] as File[],
    });
    // const [receipt, setReceipts] = useState<MaterialReceipt | null>(null);

    useEffect(() => {
      if (selectedReceipt) {
        setSheetFormData({
          inward_number: selectedReceipt.inward_number || "",
          remark: selectedReceipt.remark || "",
          images: [],
        });
      }
    }, [selectedReceipt]);

    const handleSheetInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setSheetFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSheetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files) {
        setSheetFormData((prev) => ({ ...prev, images: Array.from(files) }));
      }
    };

    // const handleSheetSubmit = async () => {
    //   if (!selectedReceipt) return;
    //   const data = new FormData();
    //   data.append("inward_number", sheetFormData.inward_number);
    //   if (sheetFormData.remark) data.append("remark", sheetFormData.remark);
    //   sheetFormData.images.forEach((file) => data.append(`images`, file));

    //   try {
    //     const res = await axios.patch(
    //       `${import.meta.env.VITE_BASE_URL}/api/v1/material-receipts/${
    //         selectedReceipt.id
    //       }`,
    //       data,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    //         },
    //       }
    //     );
    //     // setReceipts((prev) =>
    //     //   prev.map((r) => (r.id === selectedReceipt.id ? res.data : r))
    //     // );
    //     setEditMode(false);
    //   } catch (err) {
    //     console.error("Error updating receipt:", err);
    //   }
    // };

    const handleNextImage = () => {
      if (
        selectedReceipt &&
        currentImageIndex < (selectedReceipt.images?.length || 0) - 1
      ) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    };

    const handlePrevImage = () => {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    };

    return (
      <>
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent className="sm:max-w-xs   bg-white border-none overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Material Receipt Details</SheetTitle>
            </SheetHeader>
            {selectedReceipt && (
              <div className="mt-8 mb-4">
                {editMode ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                    //   handleSheetSubmit();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block font-medium text-gray-700">
                        Inwand Number
                      </label>
                      <input
                        type="text"
                        name="inward_number"
                        value={sheetFormData.inward_number}
                        onChange={handleSheetInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">
                        Remark
                      </label>
                      <textarea
                        name="remark"
                        value={sheetFormData.remark}
                        onChange={handleSheetInputChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">
                        Add Images
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleSheetFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Save
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-y-2 font-normal text-gray-700">
                    <p>
                      <span className="font-medium">Inward No.:</span>{" "}
                      {selectedReceipt.inward_number}
                    </p>
                    <p>
                      <span className="font-medium">Site:</span>{" "}
                      {selectedReceipt.site?.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Item Group:</span>{" "}
                      {selectedReceipt.itemGroup?.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Item Name:</span>{" "}
                      {selectedReceipt.itemName?.name || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">In Time:</span>{" "}
                      {formatDate(selectedReceipt.created_at, 'withTime')}
                    </p>
                    <p>
                      <span className="font-medium">User:</span>{" "}
                      {selectedReceipt.user.name}
                    </p>
                    {selectedReceipt.remark && (
                      <p>
                        <span className="font-medium">Remark:</span>{" "}
                        {selectedReceipt.remark}
                      </p>
                    )}
                  </div>
                )}

                {selectedReceipt.images &&
                  selectedReceipt.images.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Images
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {selectedReceipt.images.map((image, index) => (
                          <div
                            key={image.id}
                            className="cursor-pointer border border-gray-200 rounded-md overflow-hidden w-24 h-24 relative hover:opacity-90 transition-opacity"
                            onClick={() => {
                              setCurrentImageIndex(index);
                              setImageDialogOpen(true);
                            }}
                          >
                            <img
                              src={image.directUrl}
                              alt={`Receipt image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-blue-100 bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
            {/* <SheetFooter>
              <SheetClose asChild>
                <Button type="button" className="text-white" style={{ background: "#0f50ba" }}>
                  Close
                </Button>
              </SheetClose>
            </SheetFooter> */}
            <div className="sticky bottom-0 bg-white">
              <SheetFooter>
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="text-white w-full"
                    style={{ background: "#0f50ba" }}
                  >
                    Close
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>

        {selectedReceipt &&
          selectedReceipt.images &&
          selectedReceipt.images.length > 0 && (
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="text-left">
                    Receipt Image {currentImageIndex + 1} of{" "}
                    {selectedReceipt.images.length}
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4">
                  {/* Image Container */}
                  <div className="relative w-full">
                    <img
                      src={
                        selectedReceipt.images?.[currentImageIndex]?.directUrl
                      }
                      alt={`Receipt image ${currentImageIndex + 1}`}
                      className="w-full rounded-lg object-cover max-h-96 shadow-md"
                    />
                    {/* Download Button */}
                    <Button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href =
                          selectedReceipt.images?.[currentImageIndex]
                            ?.directUrl || "";
                        link.download = `receipt_image_${
                          currentImageIndex + 1
                        }.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="absolute bottom-4 right-4 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-md flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>

                  {/* Navigation Buttons */}
                  {selectedReceipt.images?.length > 1 && (
                    <div className="flex justify-between items-center mt-4 max-w-md mx-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevImage}
                        disabled={currentImageIndex === 0}
                        className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Previous
                      </Button>

                      <span className="text-sm text-gray-600">
                        {currentImageIndex + 1} of{" "}
                        {selectedReceipt.images.length}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextImage}
                        disabled={
                          currentImageIndex ===
                          selectedReceipt.images.length - 1
                        }
                        className="flex items-center gap-2 bg-white border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Next
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      className="text-white"
                      style={{ background: "#0f50ba" }}
                      onClick={() => setImageDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          )}
      </>
    );
  };