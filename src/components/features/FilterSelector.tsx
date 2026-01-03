'use client';

import { PHOTO_FILTERS, type PhotoFilterKey } from '@/lib/constants';

interface FilterSelectorProps {
  imageUrl: string;
  selectedFilter: PhotoFilterKey;
  onSelectFilter: (filter: PhotoFilterKey) => void;
}

export default function FilterSelector({
  imageUrl,
  selectedFilter,
  onSelectFilter,
}: FilterSelectorProps) {
  const filterKeys = Object.keys(PHOTO_FILTERS) as PhotoFilterKey[];

  return (
    <div className="w-full">
      {/* Horizontal scrollable filter strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {filterKeys.map((key) => {
          const filter = PHOTO_FILTERS[key];
          const isSelected = selectedFilter === key;

          return (
            <button
              key={key}
              onClick={() => onSelectFilter(key)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${
                isSelected ? 'scale-105' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {/* Thumbnail with filter applied */}
              <div
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                  isSelected ? 'border-white' : 'border-transparent'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={filter.name}
                  className="w-full h-full object-cover"
                  style={{ filter: filter.filter }}
                />
              </div>
              {/* Filter name */}
              <span
                className={`text-xs font-medium transition-colors ${
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

