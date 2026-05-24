export interface DedicatedProgressionCardMeasurement {
  preferredHeight: number;
  compactHeight?: number;
}

export interface DedicatedProgressionPlannerOptions {
  columnCapacity: number;
  columns: number;
  cardGap: number;
  maxPages: number;
}

export interface DedicatedProgressionPlacement {
  cardIndex: number;
  pageIndex: number;
  columnIndex: number;
  usesCompactLayout: boolean;
}

export interface DedicatedProgressionPlan {
  pagesUsed: number;
  placements: DedicatedProgressionPlacement[];
  compactedCardIndices: number[];
  overflowCardIndices: number[];
}

export function planDedicatedProgressionCards(
  cards: DedicatedProgressionCardMeasurement[],
  options: DedicatedProgressionPlannerOptions
): DedicatedProgressionPlan {
  if (cards.length === 0) {
    return {
      pagesUsed: 0,
      placements: [],
      compactedCardIndices: [],
      overflowCardIndices: [],
    };
  }

  const { columnCapacity, columns, cardGap, maxPages } = options;
  const placements: DedicatedProgressionPlacement[] = [];
  const compactedCardIndices: number[] = [];
  const overflowCardIndices: number[] = [];

  let pagesUsed = 1;
  let pageIndex = 0;
  let activeColumn = 0;
  let columnHeights = Array<number>(columns).fill(0);

  const placeInColumn = (
    cardIndex: number,
    columnIndex: number,
    height: number,
    usesCompactLayout: boolean
  ): void => {
    const usedHeight = columnHeights[columnIndex];
    const gap = usedHeight > 0 ? cardGap : 0;
    columnHeights[columnIndex] = usedHeight + gap + height;
    activeColumn = columnIndex;
    placements.push({
      cardIndex,
      pageIndex,
      columnIndex,
      usesCompactLayout,
    });
    if (usesCompactLayout) {
      compactedCardIndices.push(cardIndex);
    }
  };

  const canFitInColumn = (columnIndex: number, height: number): boolean => {
    const usedHeight = columnHeights[columnIndex];
    const gap = usedHeight > 0 ? cardGap : 0;
    return usedHeight + gap + height <= columnCapacity;
  };

  const buildColumnOrder = (): number[] => {
    const ordered = [activeColumn];
    for (let index = 0; index < columns; index++) {
      if (index !== activeColumn) {
        ordered.push(index);
      }
    }
    return ordered;
  };

  const tryPlaceOnCurrentPage = (
    cardIndex: number,
    height: number,
    usesCompactLayout: boolean
  ): boolean => {
    for (const columnIndex of buildColumnOrder()) {
      if (!canFitInColumn(columnIndex, height)) {
        continue;
      }
      placeInColumn(cardIndex, columnIndex, height, usesCompactLayout);
      return true;
    }
    return false;
  };

  for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
    const card = cards[cardIndex];
    const compactHeight =
      card.compactHeight !== undefined && card.compactHeight < card.preferredHeight
        ? card.compactHeight
        : undefined;
    const candidates =
      compactHeight !== undefined
        ? [
            { height: card.preferredHeight, usesCompactLayout: false },
            { height: compactHeight, usesCompactLayout: true },
          ]
        : [{ height: card.preferredHeight, usesCompactLayout: false }];

    let placed = false;
    for (const candidate of candidates) {
      if (tryPlaceOnCurrentPage(cardIndex, candidate.height, candidate.usesCompactLayout)) {
        placed = true;
        break;
      }
    }
    if (placed) {
      continue;
    }

    if (pagesUsed < maxPages) {
      pagesUsed += 1;
      pageIndex += 1;
      activeColumn = 0;
      columnHeights = Array<number>(columns).fill(0);

      for (const candidate of candidates) {
        if (tryPlaceOnCurrentPage(cardIndex, candidate.height, candidate.usesCompactLayout)) {
          placed = true;
          break;
        }
      }
    }

    if (placed) {
      continue;
    }

    const fallbackHeight = compactHeight ?? card.preferredHeight;
    const fallbackIsCompact = compactHeight !== undefined;
    if (tryPlaceOnCurrentPage(cardIndex, fallbackHeight, fallbackIsCompact)) {
      continue;
    }

    overflowCardIndices.push(cardIndex);
  }

  return {
    pagesUsed,
    placements,
    compactedCardIndices,
    overflowCardIndices,
  };
}
