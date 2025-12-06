import { Badge } from '../components/ui/badge';

export interface AvailabilityInfo {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  disabled: boolean;
  emoji: string;
}

/**
 * Retorna informações sobre a disponibilidade de um evento
 * baseado no número de places disponíveis
 */
export function getAvailabilityInfo(availablePlaces: number | null | undefined): AvailabilityInfo {
  const places = availablePlaces ?? 0;

  if (places === 0) {
    return {
      text: 'COMPLET',
      variant: 'destructive',
      color: 'text-red-600 dark:text-red-400',
      disabled: true,
      emoji: '🚫',
    };
  } else if (places <= 5) {
    return {
      text: `⚠️ Presque complet ! Plus que ${places} place${places > 1 ? 's' : ''}`,
      variant: 'destructive',
      color: 'text-red-600 dark:text-red-400',
      disabled: false,
      emoji: '⚠️',
    };
  } else if (places <= 10) {
    return {
      text: `Plus que ${places} places !`,
      variant: 'outline',
      color: 'text-orange-600 dark:text-orange-400',
      disabled: false,
      emoji: '🔶',
    };
  } else {
    return {
      text: `${places} places disponibles`,
      variant: 'secondary',
      color: 'text-green-600 dark:text-green-400',
      disabled: false,
      emoji: '✅',
    };
  }
}

/**
 * Componente Badge de disponibilidade
 */
interface AvailabilityBadgeProps {
  availablePlaces: number | null | undefined;
  className?: string;
}

export function AvailabilityBadge({ availablePlaces, className = '' }: AvailabilityBadgeProps) {
  const info = getAvailabilityInfo(availablePlaces);

  return (
    <Badge 
      variant={info.variant} 
      className={`${info.color} font-semibold ${className}`}
    >
      {info.text}
    </Badge>
  );
}

/**
 * Componente de warning visual quando places baixas
 */
interface AvailabilityWarningProps {
  availablePlaces: number | null | undefined;
  className?: string;
}

export function AvailabilityWarning({ availablePlaces, className = '' }: AvailabilityWarningProps) {
  const places = availablePlaces ?? 0;

  if (places === 0) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚫</span>
          <div>
            <p className="font-bold text-red-900 dark:text-red-100 text-lg">
              Événement Complet
            </p>
            <p className="text-sm text-red-800 dark:text-red-200">
              Il n'y a plus de places disponibles pour cet événement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (places <= 5) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="font-bold text-red-900 dark:text-red-100 text-lg">
              Presque Complet !
            </p>
            <p className="text-sm text-red-800 dark:text-red-200">
              Plus que <strong className="text-xl">{places}</strong> place{places > 1 ? 's' : ''} disponible{places > 1 ? 's' : ''} ! Réservez vite !
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (places <= 10) {
    return (
      <div className={`bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔶</span>
          <div>
            <p className="font-bold text-orange-900 dark:text-orange-100 text-lg">
              Places Limitées
            </p>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Plus que <strong>{places}</strong> places disponibles !
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se tem mais de 10 places, não mostrar warning
  return null;
}
