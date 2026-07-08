import {
  MultiVillageBottomSheet,
  type MultiVillageActivityKind,
  type MultiVillageFilter,
  type MultiVillageItem,
} from '@/features/design-system/components/MultiVillageBottomSheet';
import { BottomSheet } from '@/ui/panels/BottomSheet';

import { MULTI_VILLAGE_SELECTOR_FILTERS, multiVillageBottomSheetLabels } from './multiVillageSheet';

export interface VillageSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filter: MultiVillageFilter;
  onFilterChange: (filter: MultiVillageFilter) => void;
  villages: MultiVillageItem[];
  totalCount: number;
  onSelectVillage: (village: MultiVillageItem) => void;
  onActivitySelect: (village: MultiVillageItem, activity: MultiVillageActivityKind) => void;
  onSort: () => void;
}

/**
 * Multi-village selector sheet, mounted from the village view and the shell header
 * (mutually exclusive contexts). Owns the shared presentation — sheet layout,
 * available filter segments, labels — so the two mount points only inject their
 * own state + navigation handlers and can never drift apart.
 */
export function VillageSelectorSheet({
  isOpen,
  onClose,
  filter,
  onFilterChange,
  villages,
  totalCount,
  onSelectVillage,
  onActivitySelect,
  onSort,
}: VillageSelectorSheetProps) {
  return (
    <BottomSheet
      className="mx-auto h-[68vh] max-w-[32rem]"
      isOpen={isOpen}
      maxHeight="68vh"
      onClose={onClose}
    >
      <MultiVillageBottomSheet
        availableFilters={MULTI_VILLAGE_SELECTOR_FILTERS}
        className="relative h-full max-h-full"
        filter={filter}
        labels={multiVillageBottomSheetLabels}
        onActivitySelect={onActivitySelect}
        onClose={onClose}
        onFilterChange={onFilterChange}
        onSelectVillage={onSelectVillage}
        onSort={onSort}
        totalCount={totalCount}
        villages={villages}
      />
    </BottomSheet>
  );
}
