export interface MaterialReceiptImage {
  id: string;
  url: string;
  directUrl: string;
  isPlaceholder?: boolean;
}

export interface MaterialReceipt {
  id: string;
  inward_number: string;
  item_group_id: string | null;
  item_name_id: string | null;
  remark: string | null;
  site_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  images: MaterialReceiptImage[];
  itemGroup?: {
    id: string;
    name: string;
  };
  itemName?: {
    id: string;
    name: string;
  };
  site?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export interface Site {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type TimePeriod = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom' | 'last3Days';

export interface CustomDateRange {
  start: string;
  end: string;
} 