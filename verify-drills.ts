import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { estimateDrillPdfPages, shouldPlaceProgressionsOnSecondPage } from "./src/utils/estimateDrillPdfPages.ts";
import type { DrillData } from "./src/types/drill.ts";

interface DrillExpectation {
  folder: string;
  expectSecondPageProgressions: boolean;
  expectedTotalPages: number;
  expectedMainContentPages?: number;
  expectedDedicatedProgressionPages?: number;
}

const drillExpectations: DrillExpectation[] = [
  {
    folder: "read-and-react",
    expectSecondPageProgressions: true,
    expectedTotalPages: 2,
    expectedMainContentPages: 1,
    expectedDedicatedProgressionPages: 1,
  },
  {
    folder: "rim-stop-cut-across",
    expectSecondPageProgressions: true,
    expectedTotalPages: 3,
    expectedMainContentPages: 2,
    expectedDedicatedProgressionPages: 1,
  },
  {
    folder: "rvh-low-to-high-release",
    expectSecondPageProgressions: true,
    expectedTotalPages: 2,
    expectedMainContentPages: 1,
    expectedDedicatedProgressionPages: 1,
  },
  {
    folder: "shot-rebound-recovery",
    expectSecondPageProgressions: true,
    expectedTotalPages: 2,
    expectedMainContentPages: 1,
    expectedDedicatedProgressionPages: 1,
  },
  {
    folder: "test-drill-max-content",
    expectSecondPageProgressions: true,
    expectedTotalPages: 2,
    expectedMainContentPages: 1,
    expectedDedicatedProgressionPages: 1,
  },
  {
    folder: "two-shot",
    expectSecondPageProgressions: true,
    expectedTotalPages: 2,
    expectedMainContentPages: 1,
    expectedDedicatedProgressionPages: 1,
  },
];

const drillsDir = path.resolve(process.cwd(), "drills");

const loadDrillData = (folder: string): DrillData => {
  const ymlPath = path.join(drillsDir, folder, "drill.yml");
  const content = fs.readFileSync(ymlPath, "utf8");
  return yaml.load(content, { schema: yaml.FAILSAFE_SCHEMA }) as DrillData;
};

const formatStatus = (passed: boolean): string => (passed ? "PASS" : "FAIL");

let failures = 0;
console.log("\n=== Drill PDF Estimate Verification ===\n");

for (const expectation of drillExpectations) {
  const drillData = loadDrillData(expectation.folder);
  const estimate = estimateDrillPdfPages(drillData);
  const secondPage = shouldPlaceProgressionsOnSecondPage(drillData);

  const checks: Array<{ label: string; passed: boolean; expected: unknown; actual: unknown }> = [
    {
      label: "progressionsSecondPage",
      passed: secondPage === expectation.expectSecondPageProgressions,
      expected: expectation.expectSecondPageProgressions,
      actual: secondPage,
    },
    {
      label: "totalPages",
      passed: estimate.totalPages === expectation.expectedTotalPages,
      expected: expectation.expectedTotalPages,
      actual: estimate.totalPages,
    },
  ];

  if (expectation.expectedMainContentPages !== undefined) {
    checks.push({
      label: "mainContentPages",
      passed: estimate.mainContentPages === expectation.expectedMainContentPages,
      expected: expectation.expectedMainContentPages,
      actual: estimate.mainContentPages,
    });
  }

  if (expectation.expectedDedicatedProgressionPages !== undefined) {
    checks.push({
      label: "dedicatedProgressionPages",
      passed:
        estimate.dedicatedProgressionPages === expectation.expectedDedicatedProgressionPages,
      expected: expectation.expectedDedicatedProgressionPages,
      actual: estimate.dedicatedProgressionPages,
    });
  }

  const passed = checks.every((check) => check.passed);
  if (!passed) {
    failures += 1;
  }

  console.log(`${formatStatus(passed)} ${expectation.folder}`);
  checks.forEach((check) => {
    if (check.passed) {
      return;
    }
    console.log(`  - ${check.label}: expected ${check.expected}, got ${check.actual}`);
  });
}

if (failures > 0) {
  console.error(`\n${failures} drill estimate check(s) failed.`);
  process.exit(1);
}

console.log("\nAll drill estimate checks passed.\n");
