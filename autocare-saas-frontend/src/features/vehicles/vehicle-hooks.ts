'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vehiclesService, type VehicleInput, type VehicleListParams } from '@/services/api/vehicles.service';

export function useVehicles(params: VehicleListParams) { return useQuery({ queryKey: ['vehicles', params], queryFn: () => vehiclesService.list(params) }); }
export function useCreateVehicle() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (input: VehicleInput) => vehiclesService.create(input), onSuccess: (vehicle) => { void queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle added'); return vehicle; }, onError: () => toast.error('Could not add vehicle') }); }
export function useUpdateVehicle() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<VehicleInput> }) => vehiclesService.update(id, input), onSuccess: (vehicle) => { void queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle updated'); return vehicle; }, onError: () => toast.error('Could not update vehicle') }); }
export function useDeleteVehicle() { const queryClient = useQueryClient(); return useMutation({ mutationFn: vehiclesService.remove, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['vehicles'] }); toast.success('Vehicle deleted'); }, onError: () => toast.error('Could not delete vehicle') }); }
