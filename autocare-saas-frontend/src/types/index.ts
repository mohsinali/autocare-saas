export interface User {
  id: string;
  tenantId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "SERVICE_ADVISOR" | "TECHNICIAN";
}
export interface AuthSession {
  accessToken: string;
  user: User;
}
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export type ServiceHistoryStatus = "DRAFT" | "COMPLETED" | "CANCELLED";
export type ServiceLineItemType = "SERVICE" | "PART" | "LABOR" | "OTHER";
export interface ServiceLineItem {
  id: string;
  tenantId: string;
  serviceHistoryId: string;
  type: ServiceLineItemType;
  description: string;
  quantity: string;
  unitPrice: string;
  notes: string | null;
  sortOrder: number;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface ServiceHistory {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  vehicleId: string | null;
  appointmentId: string | null;
  status: ServiceHistoryStatus;
  visitDate: string;
  mileageAtService: number | null;
  customerComplaint: string | null;
  initialRequest: string;
  diagnosis: string | null;
  workSummary: string | null;
  recommendations: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdBy: string | null;
  completedBy: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  subtotal: string;
  branch: Pick<Branch, "id" | "name" | "timezone">;
  customer: Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">;
  vehicle: Pick<
    Vehicle,
    | "id"
    | "customerId"
    | "vehicleCode"
    | "registrationNumber"
    | "make"
    | "model"
    | "year"
    | "currentMileage"
  > | null;
  appointment: Pick<
    Appointment,
    "id" | "appointmentDateTimeUtc" | "serviceRequested" | "status"
  > | null;
  creator: UserSummary | null;
  completer: UserSummary | null;
  canceller: UserSummary | null;
  lineItems: ServiceLineItem[];
}
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
export interface PaginatedServiceHistories {
  data: ServiceHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface ApiError {
  message: string | string[];
  statusCode: number;
}
export type VehicleStatus = "ACTIVE" | "INACTIVE" | "SOLD" | "SCRAPPED";
export interface Vehicle {
  id: string;
  tenantId: string;
  customerId: string;
  vehicleCode: string;
  nickname: string | null;
  registrationNumber: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  color: string | null;
  engineNumber: string | null;
  engineSize: string | null;
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "CNG" | null;
  transmission: "MANUAL" | "AUTOMATIC" | "CVT" | null;
  purchaseDate: string | null;
  currentMileage: number;
  lastServiceMileage: number | null;
  status: VehicleStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface PaginatedVehicles {
  data: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export interface Appointment {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  vehicleId: string;
  appointmentDateTimeUtc: string;
  estimatedDurationMinutes: number;
  serviceRequested: string;
  status: AppointmentStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export type AppointmentListItem = Appointment;
export type AppointmentDetails = Appointment;
export interface PaginatedAppointments {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  timezone: string;
  businessOpeningTime: string;
  businessClosingTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface PaginatedBranches {
  data: Branch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
