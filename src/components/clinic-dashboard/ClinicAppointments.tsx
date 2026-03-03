import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateAppointmentStatus } from '@/services/appointmentService';
import { toast } from 'sonner';
import { User, Phone, Clock, CheckCircle2, XCircle, FileText, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Appointment } from '@/types';

interface Props {
  appointments: Appointment[];
  onUpdate: () => void;
}

export function ClinicAppointments({ appointments, onUpdate }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      await updateAppointmentStatus(id, status);
      toast.success(
        status === 'confirmed'
          ? 'Appointment confirmed'
          : 'Appointment rejected — slot is now available'
      );
      onUpdate();
    } catch {
      toast.error('Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  if (appointments.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No appointments for this date</p>
          <p className="text-sm mt-1">Appointments will appear here when patients book slots</p>
        </CardContent>
      </Card>
    );
  }

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');
  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const renderGroup = (title: string, items: Appointment[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title} ({items.length})
        </h3>
        {items.map((apt) => (
          <Card key={apt.id} variant="elevated">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{apt.patient_name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {apt.patient_phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {apt.time.slice(0, 5)}
                    </span>
                  </div>
                  {apt.notes && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {apt.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      apt.status === 'confirmed' ? 'confirmed' :
                      apt.status === 'cancelled' ? 'cancelled' : 'pending'
                    }
                  >
                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </Badge>

                  {/* Pending → Accept or Reject */}
                  {apt.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-success border-success/30 hover:bg-success/10"
                        onClick={() => handleStatusChange(apt.id, 'confirmed')}
                        disabled={updatingId === apt.id}
                      >
                        {updatingId === apt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        Accept
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={updatingId === apt.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Decline this appointment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reject the appointment and make the time slot available for other patients.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Yes, Decline
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}

                  {/* Confirmed → Cancel option */}
                  {apt.status === 'confirmed' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={updatingId === apt.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel confirmed appointment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The patient will be notified and the slot will become available again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderGroup('Pending', pending)}
      {renderGroup('Confirmed', confirmed)}
      {renderGroup('Cancelled', cancelled)}
    </div>
  );
}
