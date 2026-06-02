export interface UserData {
    id: string;
    name: string;
    email?: string | null;
    phone: string;
    status: "Active" | "Inactive";
    web_access: boolean;
    app_access: boolean;
    permissions: {
        app: string[];
        web: string[];
    };
    role: string;
    sites: {
        id: string;
        name: string;
        description: string | null;
    }[];
    created_at: string;
    updated_at: string;
}