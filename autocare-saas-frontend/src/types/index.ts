export interface User { id: string; tenantId: string; email: string; role: 'OWNER' | 'ADMIN' | 'SERVICE_ADVISOR' | 'TECHNICIAN'; }
export interface AuthSession { accessToken: string; user: User; }
export interface Customer { id: string; firstName: string; lastName: string; email: string | null; phone: string; notes: string | null; createdAt: string; updatedAt: string; }
export interface PaginatedCustomers { data: Customer[]; total: number; page: number; limit: number; totalPages: number; }
export interface ServiceHistory { id: string; customerId: string; serviceDate: string; description: string; mileage: number | null; totalAmount: string; createdAt: string; }
export interface ApiError { message: string | string[]; statusCode: number; }
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'SCRAPPED';
export interface Vehicle { id: string; tenantId: string; customerId: string; vehicleCode: string; nickname: string | null; registrationNumber: string | null; vin: string | null; make: string | null; model: string | null; variant: string | null; year: number | null; color: string | null; engineNumber: string | null; engineSize: string | null; fuelType: 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'CNG' | null; transmission: 'MANUAL' | 'AUTOMATIC' | 'CVT' | null; purchaseDate: string | null; currentMileage: number; lastServiceMileage: number | null; status: VehicleStatus; notes: string | null; createdAt: string; updatedAt: string; deletedAt: string | null; }
export interface PaginatedVehicles { data: Vehicle[]; total: number; page: number; limit: number; totalPages: number; }
export interface PaginatedAppointments { data: { id: string }[]; total: number; page: number; limit: number; totalPages: number; }
