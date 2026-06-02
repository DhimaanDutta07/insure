import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { TruckRegistration, formatDate } from "./AdminDashBoard2";

interface TruckDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTruck: TruckRegistration | null;
  // onAssignPO: (truck: TruckRegistration) => void;
}

const TruckDetailSheet: React.FC<TruckDetailSheetProps> = ({
  open,
  onOpenChange,
  selectedTruck,
  // onAssignPO,
}) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg bg-white border-none overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Progress Timeline</SheetTitle>
          </SheetHeader>
          {selectedTruck && (
            <>

              {/* Timeline of events */}
              <div className="mt-8 mb-4">
                {/* <h3 className="text-lg font-medium mb-4">Progress Timeline</h3> */}
                <ol className="relative border-l border-gray-200 ml-3">
                  {/* Registration */}
                  <li className="mb-10 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full -left-3 ring-8 ring-white">
                      <svg className="w-3 h-3 text-indigo-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z"></path>
                        <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                      </svg>
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h3 className="flex items-center text-lg font-semibold text-gray-900">
                        Registration
                        {/* {getStatusBadge("Registered")} */}
                      </h3>
                    </div>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {selectedTruck.arrival_time ? formatDate(selectedTruck.arrival_time) : "Pending"}
                    </time>
                    
                    {/* Two-column layout for info and document */}
                    <div className="mb-4 flex items-start">
                      {/* Left column: Truck details */}
                      <div className="w-1/2 grid grid-cols-1 gap-x-8 gap-y-2 text-sm font-normal text-gray-700 pr-4">
                        <p><span className="font-medium">Token Number:</span> {selectedTruck.token_number || "N/A"}</p>
                        <p><span className="font-medium">Truck Number:</span> {selectedTruck.truck.truck_number}</p>
                        {/* <p><span className="font-medium">Vendor:</span> {selectedTruck.vendor.name}</p> */}
                        <p><span className="font-medium">Material:</span> {selectedTruck.material?.name || "N/A"}</p>
                        <p className="block mb-2 text-gray-500">
                          <span className="font-medium">Staff:</span>{` ${selectedTruck.inspector?.name || "N/A"}(${selectedTruck.inspector?.phone})`}</p>
                      </div>
                      
                      {/* Right column: Document preview */}
                      {selectedTruck.photo && (
                        <div className="w-1/2 pl-4">
                          <div 
                            className="cursor-pointer border border-gray-200 rounded-md overflow-hidden w-full max-w-xs relative hover:opacity-90 transition-opacity"
                            onClick={() => setImageDialogOpen(true)}
                          >
                            <img 
                              src={selectedTruck.photo} 
                              alt="Document preview" 
                              className="w-full h-35 object-cover"
                            />
                            <div className="absolute inset-0 bg-blue-100 bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>

                  {/* Weighing */}
                  <li className="mb-10 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -left-3 ring-8 ring-white">
                      <svg className="w-3 h-3 text-purple-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Weighing
                      </h3>
                      {/* <span className="ml-2">
                        {getLatestWeighingInspection(selectedTruck) ? getStatusBadge("Weighted") : getStatusBadge("Pending")}
                      </span> */}
                    </div>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {selectedTruck.weighing_inspection?.timestamp 
                        ? formatDate(selectedTruck.weighing_inspection?.timestamp) 
                        : "Pending"}
                    </time>
                    {selectedTruck.weighing_inspection? (
                      <div>
                      <div className="mb-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-normal text-gray-700">
                        <p><span className="font-medium">Gross Weight:</span> {selectedTruck.weighing_inspection.gross_weight} kg</p>
                        <p><span className="font-medium">Tare Weight:</span> {selectedTruck.weighing_inspection.tare_weight} kg</p>
                        <p><span className="font-medium">Net Weight:</span> {selectedTruck.weighing_inspection.net_weight} kg</p>
                      </div>
                        <p className="block mb-2 text-sm font-normal leading-none text-gray-500"><span className="font-medium">Staff:</span>{ ` ${selectedTruck.weighing_inspection.inspector?.name || "N/A"}(${selectedTruck.weighing_inspection.inspector?.phone || "N/A"})`}</p>
                      </div>
                    ) : (
                      <p className="mb-4 text-sm font-normal text-gray-500 italic">
                        {/* Weighing pending */}
                        </p>
                    )}
                  </li>

                  {/* Quality Inspection */}
                  <li className="mb-10 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white">
                      <svg className="w-3 h-3 text-green-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                    </span>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Quality
                      </h3>
                      {/* <span className="ml-2">
                        {selectedTruck.quality_inspection ? (
                          selectedTruck.quality_inspection.result === "Accepted" 
                            ? getStatusBadge("Inspected") 
                            : getStatusBadge("Rejected")
                        ) : (
                          getStatusBadge("Pending")
                        )}
                      </span> */}
                    </div>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {selectedTruck.quality_inspection?.timestamp 
                        ? formatDate(selectedTruck.quality_inspection.timestamp) 
                        : "Pending"}
                    </time>
                    {selectedTruck.quality_inspection ? (
                      <div>
                      <div className="mb-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-normal text-gray-700">
                        <p><span className="font-medium">Result:</span> {selectedTruck.quality_inspection.result}</p>
                        {/* <p><span className="font-medium">Inspector:</span> {selectedTruck.inspector?.name || "N/A"}</p> */}
                        <p><span className="font-medium">Moisture:</span> {selectedTruck.quality_inspection.moisture}%</p>
                        <p><span className="font-medium">Starch:</span> {selectedTruck.quality_inspection.starch}%</p>
                        <p><span className="font-medium">TFM:</span> {selectedTruck.quality_inspection.tfm}%</p>
                        {selectedTruck.quality_inspection.remark && (
                          <p className="col-span-2"><span className="font-medium">Remarks:</span> {selectedTruck.quality_inspection.remark}</p>
                        )}
                      </div>
                        <p className="block mb-2 text-sm font-normal leading-none text-gray-500"><span className="font-medium">Staff:</span>{` ${selectedTruck.quality_inspection?.inspector?.name || "N/A"} (${selectedTruck.quality_inspection.inspector?.phone || "N/A"})`}</p>
                        </div>
                    ) : (
                      <p className="mb-4 text-sm font-normal text-gray-500 italic">
                        {/* Quality inspection pending */}
                        </p>
                    )}
                  </li>

                  {/* Unloading */}
                  <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full -left-3 ring-8 ring-white">
                      <svg className="w-3 h-3 text-orange-800" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"></path>
                      </svg>
                    </span>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Unloading
                      </h3>
                      {/* <span className="ml-2">
                        {selectedTruck.unloading ? getStatusBadge("Unloaded") : getStatusBadge("Pending")}
                      </span> */}
                    </div>
                    <time className="block mb-2 text-sm font-normal leading-none text-gray-500">
                      {selectedTruck.unloading?.timestamp 
                        ? formatDate(selectedTruck.unloading.timestamp) 
                        : "Pending"}
                    </time>
                    {selectedTruck.unloading ? (
                      <div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm font-normal text-gray-700">
                        <p><span className="font-medium">Challan No:</span> {selectedTruck.unloading.challan_no}</p>
                        {/* <p><span className="font-medium">Inspector:</span> {selectedTruck.inspector?.name || "N/A"}</p> */}
                        <p><span className="font-medium">Gross Weight:</span> {selectedTruck.unloading.gross_weight.toLocaleString()} kg</p>
                        <p><span className="font-medium">Tare Weight:</span> {selectedTruck.unloading.tare_weight.toLocaleString()} kg</p>
                        <p><span className="font-medium">Net Weight:</span> {selectedTruck.unloading.net_weight.toLocaleString()} kg</p>
                        <p><span className="font-medium">Weight Out:</span> {selectedTruck.weight_out || "N/A"}</p>
                        <p><span className="font-medium">Moisture:</span> {selectedTruck.unloading.moisture}%</p>
                        <p><span className="font-medium">Starch:</span> {selectedTruck.unloading.starch}%</p>
                        <p><span className="font-medium">TFM:</span> {selectedTruck.unloading.tfm}%</p>
                        {selectedTruck.unloading.remarks && (
                          <p className="col-span-2"><span className="font-medium">Remarks:</span> {selectedTruck.unloading.remarks}</p>
                        )}
                      </div>
                        <p className="block mt-2 mb-2 text-sm font-normal leading-none text-gray-500"><span className="font-medium">Staff:</span> {` ${selectedTruck.unloading?.inspector?.name || "N/A"}(${selectedTruck.unloading.inspector?.phone || "N/A"})`}</p>
                      </div>
                      ) : (
                      <p className="text-sm font-normal text-gray-500 italic">
                        {/* Unloading pending */}
                        </p>
                    )}
                  </li>
                </ol>
              </div>
            </>
          )}
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button"
              className="text-white"
              style={{ background: "#0f50ba" }}
              >Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Image Dialog */}
      {selectedTruck && selectedTruck.photo && (
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-left">Vehicle Picture</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <img 
                src={selectedTruck.photo}
                alt="Truck document" 
                className="w-full rounded-md object-cover max-h-96"
              />
            </div>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button type="button"
                className="text-white"
                style={{ background: "#0f50ba" }}
                >Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TruckDetailSheet;