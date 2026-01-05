'use client';

import { useEffect, useRef } from 'react';
import { PHOTO_FILTERS, type PhotoFilterKey } from '@/lib/constants';

// Colorful sunset photo that shows filter differences clearly
const SAMPLE_PHOTO = 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300&q=90';

interface FilterSelectorProps {
  imageUrl?: string;
  selectedFilter: PhotoFilterKey;
  onSelectFilter: (filter: PhotoFilterKey) => void;
  livePreview?: boolean;
}

export default function FilterSelector({
  imageUrl,
  selectedFilter,
  onSelectFilter,
  livePreview = false,
}: FilterSelectorProps) {
  const filterKeys = Object.keys(PHOTO_FILTERS) as PhotoFilterKey[];
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected filter into view on mount
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' });
    }
  }, []);

  // Use the provided image, or fallback to sample photo for previews
  const previewImage = imageUrl || SAMPLE_PHOTO;

  return (
    <div className="w-full">
      {/* Horizontal scrollable filter strip */}
      <div className="flex gap-5 overflow-x-auto py-3 px-4 scrollbar-hide">
        {filterKeys.map((key) => {
          const filter = PHOTO_FILTERS[key];
          const isSelected = selectedFilter === key;

          return (
            <button
              key={key}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelectFilter(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-2.5 transition-all duration-200 ${
                isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {/* Larger thumbnail with real photo */}
              <div
                className={`w-20 h-20 rounded-2xl overflow-hidden transition-all ${
                  isSelected 
                    ? 'ring-3 ring-amber-400 shadow-xl shadow-amber-500/40' 
                    : 'border-2 border-white/30'
                }`}
              >
                <img
                  src={previewImage}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{ filter: filter.filter }}
                  loading="eager"
                />
              </div>
              
              {/* Filter name */}
              <span
                className={`text-sm font-medium transition-colors ${
                  isSelected ? 'text-amber-400' : 'text-white/60'
                }`}
              >
                {filter.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
