'use client';

import { PHOTO_FILTERS, type PhotoFilterKey } from '@/lib/constants';

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

  return (
    <div className="w-full">
      {/* Horizontal scrollable filter strip */}
      <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide justify-center">
        {filterKeys.map((key) => {
          const filter = PHOTO_FILTERS[key];
          const isSelected = selectedFilter === key;

          return (
            <button
              key={key}
              onClick={() => onSelectFilter(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 transition-all ${
                isSelected ? '' : 'opacity-60 hover:opacity-100'
              }`}
            >
              {/* Thumbnail - either image or gradient placeholder */}
              <div
                className={`rounded-xl overflow-hidden border-2 transition-colors ${
                  isSelected ? 'border-white' : 'border-transparent'
                } ${livePreview ? 'w-12 h-12' : 'w-16 h-16'}`}
              >
                {livePreview ? (
                  // Gradient placeholder for live preview mode
                  <div 
                    className="w-full h-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
                    style={{ filter: filter.filter }}
                  />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={filter.name}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.filter }}
                  />
                ) : null}
              </div>
              {/* Filter name */}
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isSelected ? 'text-white' : 'text-zinc-400'
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
