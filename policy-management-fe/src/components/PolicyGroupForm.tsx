import React, { useState, useEffect } from 'react';
import type { PolicyGroup } from '../types/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface PolicyGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policyGroup?: PolicyGroup;
  onSubmit: (values: { name: string; description?: string | null }) => Promise<void>;
  loading?: boolean;
}

const PolicyGroupModal: React.FC<PolicyGroupModalProps> = ({
  open,
  onOpenChange,
  policyGroup,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<PolicyGroup>>({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policyGroup) {
      setFormData({
        name: policyGroup.name,
        description: policyGroup.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [policyGroup]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      await onSubmit({ 
        name: formData.name.trim(), 
        description: formData.description?.trim() || null 
      });
      onOpenChange(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-left">
            {policyGroup ? "Update Policy Group" : "Create Policy Group"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              required
              placeholder="Enter policy group name"
              disabled={loading}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Enter description (optional)"
              disabled={loading}
              rows={3}
              className="w-full p-2 border rounded resize-none"
            />
          </div>
          
          {error && (
            <p className="text-red-600">{error}</p>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? (policyGroup ? "Updating..." : "Creating...") : policyGroup ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyGroupModal; 