import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

interface Site {
  id: string;
  name: string;
}

interface SiteSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSitesSelected: (selectedSites: string[]) => void;
}

const SiteSelectionDialog: React.FC<SiteSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSitesSelected,
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/sites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        setSites(response.data);
      } catch (error) {
        console.error('Failed to fetch sites:', error);
        toast.error('Failed to fetch sites');
      }
    };

    if (isOpen) {
      fetchSites();
    }
  }, [isOpen]);

  const handleSiteSelect = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(prev => prev.filter(id => id !== siteId));
    } else {
      setSelectedSites(prev => [...prev, siteId]);
    }
  };

  const handleSubmit = () => {
    if (selectedSites.length === 0) {
      toast.error('Please select at least one site');
      return;
    }
    onSitesSelected(selectedSites);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Sites</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedSites.map((siteId) => {
              const site = sites.find((s) => s.id === siteId);
              return (
                <Badge
                  key={siteId}
                  className="bg-blue-100 text-blue-800 px-2 py-1"
                >
                  {site?.name}
                  <button
                    onClick={() => handleSiteSelect(siteId)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
          <div className="grid gap-2">
            {sites.map((site) => (
              <Button
                key={site.id}
                variant={selectedSites.includes(site.id) ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleSiteSelect(site.id)}
              >
                {site.name}
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SiteSelectionDialog; 