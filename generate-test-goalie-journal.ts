import * as fs from "fs";
import * as path from "path";
import { jsPDF } from "jspdf";
import { parseMarkdown } from "./src/utils/markdownParser";

// Simple dimension parser for PNG and JPEG
function getImageDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.readUInt32BE(0) === 0x89504e47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    if (buffer.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xffc0 || marker === 0xffc2) {
          const _length = buffer.readUInt16BE(offset);
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        } else {
          const length = buffer.readUInt16BE(offset);
          offset += length;
        }
      }
    }
  } catch (e) {
    console.error("Error reading image dimensions:", e);
  }
  return null;
}

async function run() {
  const args = process.argv.slice(2);
  let goalieName = "Test Goalie";
  let teamName = "Test Team";
  let logoPath = "";
  let outputPath = "test-goalie-journal.pdf";
  let entryCount = 24;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      goalieName = args[i + 1];
      i++;
    } else if (args[i] === "--team" && args[i + 1]) {
      teamName = args[i + 1];
      i++;
    } else if (args[i] === "--logo" && args[i + 1]) {
      logoPath = args[i + 1];
      i++;
    } else if (args[i] === "--out" && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === "--entries" && args[i + 1]) {
      entryCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
Usage: tsx generate-test-goalie-journal.ts [options]

Options:
  --name <string>      Goalie Name (default: "Test Goalie")
  --team <string>      Team Name (default: "Test Team")
  --logo <path>        Path to logo image file (optional)
  --out <path>         Path to output .pdf file (default: "test-goalie-journal.pdf")
  --entries <number>   Number of weekly entry pages to generate (default: 24)
      `);
      return;
    }
  }

  // Resolve output path to be in test-docs if it's a simple filename or relative path
  if (!outputPath.includes("/") && !outputPath.includes("\\")) {
    outputPath = path.join("test-docs", outputPath);
  }

  // Make sure file extension is .pdf
  if (path.extname(outputPath).toLowerCase() === ".docx") {
    outputPath = outputPath.slice(0, -5) + ".pdf";
  }

  // Ensure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("Generating test goalie journal with options:");
  console.log(`  Goalie Name: ${goalieName}`);
  console.log(`  Team Name:   ${teamName}`);
  console.log(`  Logo:        ${logoPath || "None"}`);
  console.log(`  Entries:     ${entryCount}`);
  console.log(`  Output:      ${outputPath}\n`);

  // Paths to content markdown files
  const contentDir = path.join(__dirname, "src/content/goalie-journal");
  const coverMd = fs.readFileSync(path.join(contentDir, "cover.md"), "utf8");
  const seasonGoalsMd = fs.readFileSync(path.join(contentDir, "season-goals.md"), "utf8");
  const practiceEntryMd = fs.readFileSync(path.join(contentDir, "practice-entry.md"), "utf8");
  const endOfSeasonMd = fs.readFileSync(path.join(contentDir, "end-of-season.md"), "utf8");

  const currentYear = new Date().getFullYear();
  const season = `${currentYear}-${currentYear + 1}`;

  const doc = new jsPDF();

  // Cover page
  const coverBlocks = parseMarkdown(coverMd);
  const coverTitle = coverBlocks.find((b) => b.type === "heading")?.text ?? "Goalie Journal";
  const coverSubtitle = coverBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setFontSize(28);
  doc.text(coverTitle, 105, 40, { align: "center" });
  doc.setFontSize(18);
  doc.text(goalieName, 105, 58, { align: "center" });
  doc.text(teamName, 105, 72, { align: "center" });
  doc.text(`Season ${season}`, 105, 86, { align: "center" });
  if (coverSubtitle) {
    doc.setFontSize(10);
    doc.text(coverSubtitle, 105, 97, { align: "center" });
  }

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const ext = path.extname(logoPath).toLowerCase();
      let format = "PNG";
      if (ext === ".jpg" || ext === ".jpeg") {
        format = "JPEG";
      }

      const imageDimensions = getImageDimensions(logoPath);
      const maxW = 60;
      const maxH = 60;
      let w = imageDimensions ? imageDimensions.width : maxW;
      let h = imageDimensions ? imageDimensions.height : maxH;
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;

      const imgBuffer = fs.readFileSync(logoPath);
      doc.addImage(imgBuffer, format, 105 - w / 2, 110, w, h);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }
  }

  // Season Goals page
  doc.addPage();
  const goalsBlocks = parseMarkdown(seasonGoalsMd);
  const goalsTitle = goalsBlocks.find((b) => b.type === "heading")?.text ?? "Season Goals";
  const goalsPrompt = goalsBlocks.find((b) => b.type === "paragraph")?.text ?? "";

  doc.setFontSize(20);
  doc.text(goalsTitle, 105, 20, { align: "center" });
  doc.setFontSize(12);
  if (goalsPrompt) {
    doc.text(goalsPrompt, 20, 40);
  }

  for (let i = 0; i < 8; i++) {
    const y = 55 + i * 25;
    doc.text(`${i + 1}.`, 20, y);
    doc.line(30, y, 190, y);
    doc.line(30, y + 10, 190, y + 10);
  }

  // Practice/Game Log pages
  const entryBlocks = parseMarkdown(practiceEntryMd);
  const entryTitle = entryBlocks.find((b) => b.type === "heading")?.text ?? "Practice & Game Log";
  const entryLabels = entryBlocks
    .filter((b) => b.type === "paragraph" || b.type === "bullet")
    .map((b) => b.text);

  const labelMaxWidth = 165;
  const labelLineHeight = 5;
  const labelRowGap = 8;
  const entryHeaderHeight = 23;
  const entryBorderPadding = 2;
  const entryMinHeight = 50;

  doc.setFontSize(9);
  const labelWrapped = entryLabels.map(
    (label) => doc.splitTextToSize(label, labelMaxWidth) as string[]
  );
  const computedEntryHeight =
    entryHeaderHeight +
    labelWrapped.reduce((sum, lines) => sum + lines.length * labelLineHeight + labelRowGap, 0) +
    entryBorderPadding;
  const entryHeight = Math.max(entryMinHeight, computedEntryHeight);
  const journalPageHeight = doc.internal.pageSize.height;
  const availablePerPage = journalPageHeight - 40;
  const entriesPerPage = Math.max(1, Math.floor(availablePerPage / entryHeight));
  const numLogPages = Math.ceil(entryCount / entriesPerPage);

  for (let page = 0; page < numLogPages; page++) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`${entryTitle} - Page ${page + 1}`, 105, 15, { align: "center" });

    const firstEntry = page * entriesPerPage;
    const lastEntry = Math.min(firstEntry + entriesPerPage, entryCount);
    for (let entry = firstEntry; entry < lastEntry; entry++) {
      const startY = 25 + (entry - firstEntry) * entryHeight;
      const entryNum = entry + 1;

      doc.setLineWidth(0.5);
      doc.rect(15, startY, 180, entryHeight - 2);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Entry ${entryNum}`, 20, startY + 7);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(9);
      doc.text("Date: _______________", 20, startY + 15);
      doc.text("□ Practice  □ Game", 80, startY + 15);
      doc.text("Opponent: _______________", 135, startY + 15);

      let promptY = startY + entryHeaderHeight;
      labelWrapped.forEach((lines) => {
        lines.forEach((line, lineIdx) => {
          doc.text(line, 20, promptY + lineIdx * labelLineHeight);
        });
        const underlineY = promptY + lines.length * labelLineHeight + 1;
        doc.line(20, underlineY, 190, underlineY);
        promptY += lines.length * labelLineHeight + labelRowGap;
      });
    }
  }

  // End of Season Review page
  doc.addPage();
  const eosBlocks = parseMarkdown(endOfSeasonMd);
  const eosTitle = eosBlocks.find((b) => b.type === "heading")?.text ?? "End of Season Review";
  const eosPrompts = eosBlocks
    .filter((b) => b.type === "paragraph" || b.type === "bullet")
    .map((b) => b.text);

  doc.setFontSize(20);
  doc.text(eosTitle, 105, 20, { align: "center" });

  const eosPageHeight = doc.internal.pageSize.height - 15;
  const eosAnswerLines = 3;
  const eosAnswerLineSpacing = 15;
  const eosBlockHeight = 10 + eosAnswerLines * eosAnswerLineSpacing;
  doc.setFontSize(12);
  let eosY = 40;
  eosPrompts.forEach((prompt) => {
    if (eosY + eosBlockHeight > eosPageHeight) {
      doc.addPage();
      eosY = 20;
    }
    const promptLines = doc.splitTextToSize(prompt, 170) as string[];
    promptLines.forEach((line, lineIdx) => {
      doc.text(line, 20, eosY + lineIdx * 6);
    });
    const eosAnswerStart = eosY + promptLines.length * 6 + 2;
    for (let i = 0; i < eosAnswerLines; i++) {
      doc.line(
        20,
        eosAnswerStart + i * eosAnswerLineSpacing,
        190,
        eosAnswerStart + i * eosAnswerLineSpacing
      );
    }
    eosY += eosBlockHeight + (promptLines.length - 1) * 6;
  });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated goalie journal successfully at: ${outputPath}`);
}

run().catch((err) => {
  console.error("Fatal error generating goalie journal:", err);
  throw err instanceof Error ? err : new Error(String(err));
});
