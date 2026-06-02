import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  FileText, 
  User, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Trash2
} from "lucide-react";
import { Claim } from "../../types/claim";
import { updateClaimStatus, deleteClaim } from "../../services/claim.service";
import { toast } from "sonner";

interface ClaimListProps {
  claims: Claim[];
  onStatusUpdate: () => void;
  onDelete: () => void;
}

export const ClaimList: React.FC<ClaimListProps> = ({ claims, onStatusUpdate, onDelete }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Paid': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleStatusUpdate = async (claimId: string, status: string) => {
    try {
      await updateClaimStatus(claimId, status);
      onStatusUpdate();
      toast.success(`Claim ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error("Failed to update claim status");
    }
  };

  const handleDelete = async (claimId: string) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        await deleteClaim(claimId);
        onDelete();
        toast.success("Claim deleted successfully");
      } catch (error) {
        console.error('Error deleting claim:', error);
        toast.error("Failed to delete claim");
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (claims.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Found</h3>
        <p className="text-gray-500">No claims have been created for this policy yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">
                    {claim.claim_type} Claim
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Created on {formatDate(claim.created_at)}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(claim.claim_status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(claim.claim_status)}
                  {claim.claim_status}
                </div>
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-semibold">
                  {formatCurrency(claim.claim_amount)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Members:</span>
                <span className="font-semibold">
                  {claim.claim_members?.length || 0}
                </span>
              </div>
            </div>

            {/* Members List */}
            {claim.claim_members && claim.claim_members.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Claim Members:</h4>
                <div className="space-y-2">
                  {claim.claim_members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                          {member.insured_member.name} ({member.insured_member.relation_to_proposer})
                        </span>
                      </div>
                      {member.member_claim_amount && (
                        <span className="text-sm font-medium">
                          {formatCurrency(member.member_claim_amount)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks */}
            {claim.claim_remarks && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Remarks:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {claim.claim_remarks}
                </p>
              </div>
            )}

            {/* Documents */}
            {claim.documents && claim.documents.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Documents:</h4>
                <div className="flex flex-wrap gap-2">
                  {claim.documents.map((doc) => (
                    <Badge key={doc.id} variant="outline" className="text-xs">
                      {doc.original_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {claim.claim_status === 'Pending' && (
                <>
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusUpdate(claim.id, 'Approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusUpdate(claim.id, 'Rejected')}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </>
              )}
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDelete(claim.id)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 