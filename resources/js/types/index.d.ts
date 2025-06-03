export interface User {
    id: string;
    name: string;
    email: string;
    enterprise_id: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
        role: "Sudo" | "Admin" | "Customer" | null;
    } | null;
};
