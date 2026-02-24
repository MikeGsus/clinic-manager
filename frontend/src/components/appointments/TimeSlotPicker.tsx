import { useQuery } from '@tanstack/react-query';
import { fetchAvailableSlots } from '@/lib/appointments.api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  doctorId: string;
  date: string; // "YYYY-MM-DD"
  value?: string;
  onChange: (slot: string) => void;
}

export function TimeSlotPicker({ doctorId, date, value, onChange }: TimeSlotPickerProps) {
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['available-slots', doctorId, date],
    queryFn: () => fetchAvailableSlots(doctorId, date),
    enabled: Boolean(doctorId && date),
  });

  if (!doctorId || !date) {
    return <p className="text-sm text-gray-400">Selecciona doctor y fecha primero</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-400">Cargando horarios...</p>;
  }

  if (slots.length === 0) {
    return <p className="text-sm text-orange-500">Sin horarios disponibles para esta fecha</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          type="button"
          variant="outline"
          size="sm"
          disabled={!slot.available}
          className={cn(
            'font-mono',
            slot.available && value === slot.time && 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white',
            !slot.available && 'opacity-40 line-through cursor-not-allowed'
          )}
          onClick={() => onChange(slot.time)}
        >
          {slot.time}
        </Button>
      ))}
    </div>
  );
}
