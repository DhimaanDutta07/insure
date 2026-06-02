import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Commission {
  id: string;
  name: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CommissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission?: Commission;
  onSave: (commission: Commission) => void;
}

export const CommissionModal: React.FC<CommissionModalProps> = ({
  open,
  onOpenChange,
  commission,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Commission>>({
    name: '',
    amount: 0,
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (commission) {
      setFormData({
        name: commission.name,
        amount: commission.amount,
        description: commission.description || '',
      });
    } else {
      setFormData({ name: '', amount: 0, description: '' });
    }
  }, [commission]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = commission?.id
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/commissions/${commission.id}`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/commissions`;
      const method = commission?.id ? 'patch' : 'post';
      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      onSave(res.data); // Backend should return full Commission with id, createdAt, updatedAt
      onOpenChange(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className='text-left'>{commission?.id ? 'Update Commission' : 'Create Commission'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name <span className='text-red-500'>*</span></Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount <span className='text-red-500'>*</span></Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded"
              min={0}
              step={0.01}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className='border border-gray-300 hover:bg-gray-100'>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              {commission?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionModal; 