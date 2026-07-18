'use client';

import { useState } from 'react';
import { Card, cn } from '@carpool/ui';
import { ChevronDown, ShieldCheck } from 'lucide-react';

const RATING_OPTIONS = [
  { value: '4.8', label: '4.8+ Top Rated' },
  { value: '4.5', label: '4.5+ Very Good' },
  { value: '4.0', label: '4.0+ Satisfactory' },
] as const;

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2">
        {icon}
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {description ? (
            <span className="block text-[11px] text-muted-foreground">{description}</span>
          ) : null}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-secondary',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </label>
  );
}

function RangeInput({
  maxPrice,
  onChange,
  max = 50,
}: {
  maxPrice: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={0}
        max={max}
        value={maxPrice}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1 w-full cursor-pointer accent-primary"
        aria-label="Maximum price per seat"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{max === 50 ? '$0' : '20 kr'}</span>
        <span>{max === 50 ? '$50' : '150 kr'}</span>
      </div>
    </div>
  );
}

export function SearchFilters({
  className,
  variant = 'comparison',
}: {
  className?: string;
  variant?: 'comparison' | 'route';
}) {
  const [maxPrice, setMaxPrice] = useState(variant === 'route' ? 80 : 25);
  const [window, setWindow] = useState<string | null>(null);
  const [rating, setRating] = useState<string | null>(variant === 'route' ? '4.5' : null);
  const [vehicleType, setVehicleType] = useState('All types');
  const [womenFriendly, setWomenFriendly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const clearAll = () => {
    setMaxPrice(variant === 'route' ? 80 : 25);
    setWindow(null);
    setRating(variant === 'route' ? '4.5' : null);
    setVehicleType('All types');
    setWomenFriendly(false);
    setVerifiedOnly(true);
  };

  if (variant === 'route') {
    return (
      <Card className={cn('space-y-6 rounded-[14px] p-4 shadow-none', className)}>
        <h3 className="text-lg font-medium">Filters</h3>
        <Toggle
          checked={verifiedOnly}
          onChange={setVerifiedOnly}
          label="Verified Colleagues"
          description="Only show employees from your network"
          icon={<ShieldCheck className="h-4 w-4 shrink-0 text-primary" />}
        />
        <div className="space-y-3">
          <p className="text-sm font-medium">Price Range (SEK)</p>
          <RangeInput max={150} maxPrice={maxPrice} onChange={setMaxPrice} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2 text-sm font-medium">
            Pickup Time
            <span className="relative block">
              <select
                value={window ?? 'Any time'}
                onChange={(event) =>
                  setWindow(event.target.value === 'Any time' ? null : event.target.value)
                }
                className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm font-normal"
              >
                <option>Any time</option>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Evening</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            Vehicle Type
            <span className="relative block">
              <select
                value={vehicleType}
                onChange={(event) => setVehicleType(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm font-normal"
              >
                <option>All types</option>
                <option>Electric</option>
                <option>Hybrid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </span>
          </label>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Min. Driver Rating</p>
          <div className="flex gap-2">
            {['4.0+', '4.5+', '4.8+'].map((option) => {
              const value = option.slice(0, 3);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRating(value)}
                  className={cn(
                    'rounded-full border bg-background px-3 py-1 text-xs font-medium',
                    rating === value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={clearAll}
          className="text-left text-xs font-medium text-primary hover:underline"
        >
          Reset filters
        </button>
      </Card>
    );
  }

  return (
    <Card className={cn('space-y-6 rounded-[14px] p-5 shadow-none', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Price Range</p>
        <RangeInput maxPrice={maxPrice} onChange={setMaxPrice} />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">Driver Rating</p>
        <div className="space-y-2">
          {RATING_OPTIONS.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="driver-rating"
                className="accent-primary"
                checked={rating === option.value}
                onChange={() => setRating(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4 border-t pt-4">
        <Toggle checked={womenFriendly} onChange={setWomenFriendly} label="Women Friendly" />
        <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified Colleagues" />
      </div>
    </Card>
  );
}
