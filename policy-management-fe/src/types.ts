export type User = {
  id: string;
  name: string;
  email: string;
  phone: number;
  role: string;
  created_at: string;
  status: 'Active' | 'Inactive';
  updated_at: string;
  permissions?: {
      app: string[];
      web: string[];
  };
  app_access?: boolean;
  web_access?: boolean;
}
  
  export interface Role {
    role_id: string;
    role_name: string;
    permissions: {
      [key: string]: boolean;
    };
  }
  
  export interface AuthContextType {
    user: User | null;
    role: Role | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (name: string, email: string | null, password: string, phoneNumber: string) => Promise<void>;
    logout: () => void;
    sendOTP:(phone: string) => Promise<void>;
    verifyOTP:(phone:string, otp:string)=> Promise<void>;
    hasPermission: (permission: string) => boolean;
    setUserSites: (sites: string[]) => Promise<void>;
  }