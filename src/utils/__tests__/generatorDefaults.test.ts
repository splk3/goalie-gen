import { getSeasonOverviewMarkdown } from "../generatorDefaults";

const seasonOverviewMd = `## Season Overview

### Selected Overview Placeholder

[SEASON_OVERVIEW_SELECTED]

### 8U Starter Content Placeholder

[SEASON_OVERVIEW_8U_STARTER]

### 10U Starter Content Placeholder

[SEASON_OVERVIEW_10U_STARTER]

### 12U Starter Content Placeholder

[SEASON_OVERVIEW_12U_STARTER]

### 14U Starter Content Placeholder

[SEASON_OVERVIEW_14U_STARTER]

### 16U and older Starter Content Placeholder

[SEASON_OVERVIEW_16U_AND_OLDER_STARTER]
`;

describe("getSeasonOverviewMarkdown", () => {
  it("uses 14U starter content for 14U selections", () => {
    const markdown = getSeasonOverviewMarkdown(true, "14U", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_14U_STARTER]");
  });

  it("uses 16U and older starter content for 16U and older selections", () => {
    const markdown = getSeasonOverviewMarkdown(true, "16U and older", seasonOverviewMd);
    expect(markdown).toContain("[SEASON_OVERVIEW_16U_AND_OLDER_STARTER]");
  });
});
