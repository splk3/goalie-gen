import { renderHook, act } from "@testing-library/react";
import { useDrillFilters } from "../useDrillFilters";

const makeDrills = () => [
  {
    tags: {
      skill_level: ["beginner"],
      team_drill: ["no"],
      age_level: ["U10", "U12"],
      fundamental_skill: ["angles"],
      skating_skill: ["edges"],
      equipment: ["stick"],
    },
  },
  {
    tags: {
      skill_level: ["intermediate"],
      team_drill: ["yes"],
      age_level: ["U12", "U14"],
      fundamental_skill: ["positioning"],
      skating_skill: ["crossovers"],
      equipment: ["stick", "pucks"],
    },
  },
  {
    tags: {
      skill_level: ["advanced"],
      team_drill: ["yes"],
      age_level: ["U14", "U16"],
      fundamental_skill: ["angles"],
      skating_skill: ["edges"],
      equipment: ["pucks"],
    },
  },
];

describe("useDrillFilters", () => {
  it("returns all drills when no filters are selected", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    expect(result.current.filteredDrills).toHaveLength(3);
  });

  it("filters drills by a single tag value", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
    });

    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.skill_level).toContain("beginner");
  });

  it("filters drills by multiple tag values within the same category (OR logic)", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
      result.current.toggleFilter("skill_level", "intermediate");
    });

    expect(result.current.filteredDrills).toHaveLength(2);
  });

  it("filters drills across multiple categories (AND logic)", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("team_drill", "yes");
      result.current.toggleFilter("skill_level", "intermediate");
    });

    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.skill_level).toContain("intermediate");
  });

  it("untoggling a filter removes it from active filters", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
    });
    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
    });

    expect(result.current.filteredDrills).toHaveLength(3);
    expect(result.current.activeFilters).toHaveLength(0);
  });

  it("resetFilters clears all selected filters", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
      result.current.toggleFilter("team_drill", "yes");
    });
    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filteredDrills).toHaveLength(3);
    expect(result.current.activeFilters).toHaveLength(0);
  });

  it("removeFilter removes a specific filter value", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("age_level", "U12");
      result.current.toggleFilter("age_level", "U14");
    });
    act(() => {
      result.current.removeFilter("age_level", "U12");
    });

    expect(result.current.selectedFilters.age_level).toEqual(["U14"]);
  });

  it("builds tagCategories from drill data", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    expect(result.current.tagCategories.skill_level).toEqual(
      expect.arrayContaining(["beginner", "intermediate", "advanced"])
    );
    expect(result.current.tagCategories.team_drill).toEqual(expect.arrayContaining(["no", "yes"]));
  });

  it("formatTagName converts snake_case to Title Case", () => {
    const { result } = renderHook(() => useDrillFilters([]));

    expect(result.current.formatTagName("skill_level")).toBe("Skill Level");
    expect(result.current.formatTagName("team_drill")).toBe("Team Drill");
    expect(result.current.formatTagName("fundamental_skill")).toBe("Fundamental Skill");
  });

  it("formatTagValue converts snake_case values to Title Case", () => {
    const { result } = renderHook(() => useDrillFilters([]));

    expect(result.current.formatTagValue("beginner")).toBe("Beginner");
    expect(result.current.formatTagValue("some_value")).toBe("Some Value");
  });

  it("returns activeFilters as a flat list of category/value pairs", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("skill_level", "beginner");
      result.current.toggleFilter("team_drill", "yes");
    });

    expect(result.current.activeFilters).toEqual(
      expect.arrayContaining([
        { category: "skill_level", value: "beginner" },
        { category: "team_drill", value: "yes" },
      ])
    );
  });
});
