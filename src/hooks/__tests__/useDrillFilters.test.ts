import { renderHook, act } from "@testing-library/react";
import { useDrillFilters } from "../useDrillFilters";

const makeDrills = () => [
  {
    tags: {
      skill_level: ["beginner"],
      team_drill: "no",
      age_level: ["U10", "U12"],
      fundamental_skill: ["angles"],
      skating_skill: ["edges"],
      equipment: ["stick"],
      space_required: ["full_ice"],
    },
  },
  {
    tags: {
      skill_level: ["intermediate"],
      team_drill: "yes",
      age_level: ["U12", "U14"],
      fundamental_skill: ["positioning"],
      skating_skill: ["crossovers"],
      equipment: ["stick", "pucks"],
      space_required: ["flexible"],
    },
  },
  {
    tags: {
      skill_level: ["advanced"],
      team_drill: "yes",
      age_level: ["U14", "U16"],
      fundamental_skill: ["angles"],
      skating_skill: ["edges"],
      equipment: ["pucks"],
      space_required: ["flexible"],
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

  it("matches an age group, younger groups, and All", () => {
    const drills = [
      {
        tags: {
          age_level: ["10_and_under"],
        },
      },
      {
        tags: {
          age_level: ["12U"],
        },
      },
      {
        tags: {
          age_level: ["14U"],
        },
      },
      {
        tags: {
          age_level: ["all"],
        },
      },
    ];
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("age_level", "12U");
    });

    expect(result.current.filteredDrills).toHaveLength(3);
    expect(result.current.filteredDrills.map((drill) => drill.tags.age_level)).toEqual([
      ["10_and_under"],
      ["12U"],
      ["all"],
    ]);
  });

  it("keeps explicit All age filtering exact", () => {
    const drills = [
      {
        tags: {
          age_level: ["10_and_under"],
        },
      },
      {
        tags: {
          age_level: ["all"],
        },
      },
    ];
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("age_level", "all");
    });

    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.age_level).toEqual(["all"]);
  });

  it("uses OR logic for multiple age selections", () => {
    const drills = [
      {
        tags: {
          age_level: ["10_and_under"],
        },
      },
      {
        tags: {
          age_level: ["12U"],
        },
      },
      {
        tags: {
          age_level: ["14U"],
        },
      },
      {
        tags: {
          age_level: ["16U_and_older"],
        },
      },
      {
        tags: {
          age_level: ["all"],
        },
      },
    ];
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("age_level", "10_and_under");
      result.current.toggleFilter("age_level", "14U");
    });

    expect(result.current.filteredDrills).toHaveLength(4);
    expect(result.current.filteredDrills.map((drill) => drill.tags.age_level)).toEqual([
      ["10_and_under"],
      ["12U"],
      ["14U"],
      ["all"],
    ]);
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

  it("filters drills by space_required tag value", () => {
    const drills = makeDrills();
    const { result } = renderHook(() => useDrillFilters(drills));

    act(() => {
      result.current.toggleFilter("space_required", "full_ice");
    });

    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.space_required).toContain("full_ice");
  });

  it("matches drills that fit within the selected available space", () => {
    const drills = [
      ...makeDrills(),
      {
        tags: {
          skill_level: ["beginner"],
          team_drill: "no",
          age_level: ["U10"],
          fundamental_skill: ["angles"],
          skating_skill: ["edges"],
          equipment: [],
          space_required: ["crease_only"],
        },
      },
    ];
    const { result } = renderHook(() =>
      useDrillFilters(drills, undefined, {
        spaceMatching: "capacity",
      })
    );

    act(() => {
      result.current.toggleFilter("space_required", "whole_zone");
    });

    expect(result.current.filteredDrills).toHaveLength(3);
    expect(
      result.current.filteredDrills.every((drill) =>
        ["full_ice", "flexible", "crease_only"].some((space) =>
          drill.tags.space_required.includes(space)
        )
      )
    ).toBe(true);
  });

  it("treats an empty equipment tag as Equipment: None", () => {
    const drills = makeDrills();
    drills.push({
      tags: {
        skill_level: ["beginner"],
        team_drill: "no",
        age_level: ["U10"],
        fundamental_skill: ["angles"],
        skating_skill: ["edges"],
        equipment: [],
        space_required: ["crease_only"],
      },
    });
    const { result } = renderHook(() =>
      useDrillFilters(drills, {
        skill_level: [],
        team_drill: [],
        age_level: [],
        fundamental_skill: [],
        skating_skill: [],
        equipment: ["none"],
        space_required: [],
      })
    );

    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.equipment).toEqual([]);
  });

  it("resets to configured default filters", () => {
    const drills = makeDrills();
    const { result } = renderHook(() =>
      useDrillFilters(drills, undefined, {
        defaultFilters: {
          team_drill: ["no"],
          equipment: ["none"],
        },
      })
    );

    expect(result.current.selectedFilters.team_drill).toEqual(["no"]);
    expect(result.current.selectedFilters.equipment).toEqual(["none"]);

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.selectedFilters.team_drill).toEqual(["no"]);
    expect(result.current.selectedFilters.equipment).toEqual(["none"]);
  });

  it("formatTagName converts snake_case to Title Case", () => {
    const { result } = renderHook(() => useDrillFilters([]));

    expect(result.current.formatTagName("skill_level")).toBe("Skill Level");
    expect(result.current.formatTagName("team_drill")).toBe("Team Drill");
    expect(result.current.formatTagName("fundamental_skill")).toBe("Fundamental Skill");
    expect(result.current.formatTagName("space_required")).toBe("Space Required");
  });

  it("formatTagValue converts snake_case values to Title Case", () => {
    const { result } = renderHook(() => useDrillFilters([]));

    expect(result.current.formatTagValue("beginner")).toBe("Beginner");
    expect(result.current.formatTagValue("some_value")).toBe("Some Value");
    expect(result.current.formatTagValue("10_and_under")).toBe("10U and under");
    expect(result.current.formatTagValue("16U_and_older")).toBe("16U and older");
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

  it("applies initial filters on first render", () => {
    const drills = makeDrills();
    const { result } = renderHook(() =>
      useDrillFilters(drills, {
        skill_level: ["advanced"],
        team_drill: [],
        age_level: [],
        fundamental_skill: [],
        skating_skill: [],
        equipment: [],
        space_required: [],
      })
    );

    expect(result.current.selectedFilters.skill_level).toEqual(["advanced"]);
    expect(result.current.filteredDrills).toHaveLength(1);
    expect(result.current.filteredDrills[0].tags.skill_level).toContain("advanced");
  });
});
