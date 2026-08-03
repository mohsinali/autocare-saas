'use client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteVehicle } from './vehicle-hooks';
import type { Vehicle } from '@/types';
export function DeleteVehicleDialog({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }): React.JSX.Element { const remove = useDeleteVehicle(); return <Dialog open={Boolean(vehicle)} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent><h2 className="text-lg font-semibold">Delete vehicle?</h2><p className="mt-2 text-sm text-slate-500">This will remove {vehicle?.registrationNumber ?? vehicle?.vehicleCode} from the active customer workspace.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => vehicle && remove.mutate(vehicle.id, { onSuccess: onClose })}>Delete vehicle</Button></div></DialogContent></Dialog>; }
