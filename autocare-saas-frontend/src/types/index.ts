export interface User { id: string; tenantId: string; email: string; role: 'OWNER' | 'ADMIN' | 'SERVICE_ADVISOR' | 'TECHNICIAN'; }
export interface AuthSession { accessToken: string; user: User; }
export interface Customer { id: string; firstName: string; lastName: string; email: string | null; phone: string; notes: string | null; createdAt: string; updatedAt: string; }
export interface PaginatedCustomers { data: Customer[]; total: number; page: number; limit: number; totalPages: number; }
export interface ServiceHistory { id: string; customerId: string; serviceDate: string; description: string; mileage: number | null; totalAmount: string; createdAt: string; }
export interface ApiError { message: string | string[]; statusCode: number; }
