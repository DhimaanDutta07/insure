import React from "react";
import PolicyList from "../components/policy/PolicyList";
import { deletePolicy } from "../services/policy.service";

export const PolicyPage: React.FC = () => {
  // Delete handler
  const handleDeletePolicy = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      await deletePolicy(id);
      // PolicyList will handle refreshing its own data
    } catch (err) {
      console.error("Error deleting policy:", err);
    }
  };

  // Show list
  return (
    <div className="p-2">
      <PolicyList
        onDeletePolicy={handleDeletePolicy}
      />
    </div>
  );
};