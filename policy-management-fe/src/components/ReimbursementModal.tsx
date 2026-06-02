// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "./ui/dialog";
// import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Label } from "./ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

// interface Reimbursement {
//   id?: string;
//   amount: number;
//   description: string;
//   clientId: string;
//   date?: string;
// }

// interface Client {
//   id: string;
//   name: string;
// }

// interface ReimbursementModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   reimbursement?: Reimbursement;
//   clients: Client[];
//   onSave: (reimbursement: Reimbursement) => void;
// }

// export const ReimbursementModal: React.FC<ReimbursementModalProps> = ({ open, onOpenChange, reimbursement, clients, onSave }) => {
//   const [formData, setFormData] = useState<Reimbursement>({
//     amount: 0,
//     description: '',
//     clientId: '',
//   });
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (reimbursement) {
//       setFormData(reimbursement);
//     } else {
//       setFormData({ amount: 0, description: '', clientId: '' });
//     }
//   }, [reimbursement]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
//   };

//   const handleClientChange = (value: string) => {
//     setFormData(prev => ({ ...prev, clientId: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     try {
//       const url = reimbursement?.id
//         ? `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements/${reimbursement.id}`
//         : `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements`;
//       const method = reimbursement?.id ? 'patch' : 'post';
//       const res = await axios[method](url, formData, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
//       });
//       onSave(res.data);
//       onOpenChange(false);
//     } catch (err) {
//       if (axios.isAxiosError(err) && err.response?.data?.error) {
//         setError(err.response.data.error);
//       } else {
//         setError('An error occurred');
//       }
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[600px] bg-white rounded-lg border border-gray-200 shadow-lg">
//         <DialogHeader>
//           <DialogTitle>{reimbursement?.id ? 'Update Reimbursement' : 'Create Reimbursement'}</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <Label htmlFor="amount">Amount</Label>
//             <Input
//               id="amount"
//               name="amount"
//               type="number"
//               value={formData.amount}
//               onChange={handleInputChange}
//               required
//               className="w-full p-2 border rounded"
//             />
//           </div>
//           <div>
//             <Label htmlFor="description">Description</Label>
//             <Input
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               required
//               className="w-full p-2 border rounded"
//             />
//           </div>
//           <div>
//             <Label htmlFor="clientId">Client</Label>
//             <Select value={formData.clientId} onValueChange={handleClientChange}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select client" />
//               </SelectTrigger>
//               <SelectContent>
//                 {clients.map(client => (
//                   <SelectItem key={client.id} value={client.id}>
//                     {client.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           {error && <p className="text-red-600">{error}</p>}
//           <div className="flex justify-end gap-2">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
//               {reimbursement?.id ? 'Update' : 'Create'}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// };




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

interface Reimbursement {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ReimbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reimbursement?: Reimbursement;
  onSave: (reimbursement: Reimbursement) => void;
}

export const ReimbursementModal: React.FC<ReimbursementModalProps> = ({
  open,
  onOpenChange,
  reimbursement,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Reimbursement>>({
    name: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reimbursement) {
      setFormData({
        name: reimbursement.name,
        description: reimbursement.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [reimbursement]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = reimbursement?.id
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements/${reimbursement.id}`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/reimbursements`;
      const method = reimbursement?.id ? 'patch' : 'post';
      const res = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      onSave(res.data); // Backend should return full Reimbursement with id, createdAt, updatedAt
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
          <DialogTitle className='text-left'>{reimbursement?.id ? 'Update Reimbursement' : 'Create Reimbursement'}</DialogTitle>
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
              {reimbursement?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};