import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/types';

interface QRCodeDisplayProps {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodeDisplay({ appointment, open, onOpenChange }: QRCodeDisplayProps) {
  const checkinUrl = `${window.location.origin}/checkin/${appointment.qrToken}`;

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Cita</title></head><body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>Cita Médica</h2>
        <p>${appointment.patient.name}</p>
        <p>Dr. ${appointment.doctor.name}</p>
        <p>${new Date(appointment.scheduledAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
        <br/>
        <img src="${document.getElementById('appt-qr')?.querySelector('svg') ? '' : ''}" />
        <p style="font-size:12px;color:#666">Presenta este QR al llegar a tu cita</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Código QR de Check-in</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4" id="appt-qr">
          <QRCodeSVG value={checkinUrl} size={200} />

          <div className="text-center space-y-1">
            <p className="font-medium">{appointment.patient.name}</p>
            <p className="text-sm text-gray-600">Dr. {appointment.doctor.name}</p>
            <p className="text-sm text-gray-600">
              {new Date(appointment.scheduledAt).toLocaleString('es-MX', {
                timeZone: 'America/Mexico_City',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            <p className="text-xs text-gray-400 break-all">{checkinUrl}</p>
          </div>

          <Button variant="outline" onClick={handlePrint} className="w-full">
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
