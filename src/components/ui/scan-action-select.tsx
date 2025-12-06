import { Select } from './select';
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';

export type ScanAction = 'entry' | 'exit' | 'reentry';

export function ScanActionSelect({ value, onChange }: { value: ScanAction, onChange: (v: ScanAction) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder="Choisir l'action de scan" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="entry">Entrée</SelectItem>
        <SelectItem value="exit">Sortie</SelectItem>
        <SelectItem value="reentry">Re-entrée</SelectItem>
      </SelectContent>
    </Select>
  );
}
