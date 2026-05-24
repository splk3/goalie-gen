const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Import the TypeScript compiled module
const estimator = require('./src/utils/estimateDrillPdfPages.ts');

const DRILLS_DIR = './drills';
const affectedDrills = [
  'read-and-react',
  'rim-stop-cut-across',
  'rvh-low-to-high-release',
  'shot-rebound-recovery',
  'test-drill-max-content',
  'two-shot'
];

console.log('\n=== Affected Drills Page Estimates ===\n');

affectedDrills.forEach(folder => {
  const ymlPath = path.join(DRILLS_DIR, folder, 'drill.yml');
  if (fs.existsSync(ymlPath)) {
    const content = fs.readFileSync(ymlPath, 'utf8');
    const drillData = yaml.load(content, { schema: yaml.FAILSAFE_SCHEMA });
    console.log(`${folder}:`);
    console.log(`  - Expected: NOT TO WARN (main content on 1 page)`);
  }
});
