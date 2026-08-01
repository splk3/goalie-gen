import { planDedicatedProgressionCards } from "../drillPdfPaginationShared";

describe("planDedicatedProgressionCards", () => {
  it("uses the reduced capacity only on the first page", () => {
    const plan = planDedicatedProgressionCards(
      [
        { preferredHeight: 55 },
        { preferredHeight: 55 },
        { preferredHeight: 50 },
        { preferredHeight: 50 },
      ],
      {
        columnCapacity: 100,
        firstPageColumnCapacity: 60,
        columns: 2,
        cardGap: 0,
        maxPages: 2,
      }
    );

    expect(plan.pagesUsed).toBe(2);
    expect(plan.overflowCardIndices).toEqual([]);
    expect(
      plan.placements.map(({ pageIndex, columnIndex }) => ({ pageIndex, columnIndex }))
    ).toEqual([
      { pageIndex: 0, columnIndex: 0 },
      { pageIndex: 0, columnIndex: 1 },
      { pageIndex: 1, columnIndex: 0 },
      { pageIndex: 1, columnIndex: 0 },
    ]);
  });
});
