---
name: new-drill-from-issue
description: "Convert a GitHub issue into a new drill. Use when: adding a new drill from a goalie-drills issue, ingesting a drill issue, creating drill.yml from issue template, processing a new-drill issue, drill from GitHub issue, issue label goalie-drills."
argument-hint: "GitHub issue number or URL for the new drill issue"
---

# New Drill From Issue

Convert a `goalie-drills`-labelled GitHub issue (submitted via the **Add a New Drill** issue template) into a new drill folder, `drill.yml`, and image file — then validate and open a PR.

## When to Use

- A GitHub issue with the `goalie-drills` label exists and needs to be turned into files
- The issue was submitted using the **Add a New Drill** issue template
- You need to ingest a drill issue, create drill.yml, or add a new drill from an issue

## Step 1 — Load the Issue

Use GitHub tools to fetch the issue body and all attachments. If no issue number was provided, list open issues with the `goalie-drills` label and ask the user which one to process.

- Identify the issue number and confirm it was filed with the **Add a New Drill** template
- Extract all field values from the issue body (see Field Mapping below)

## Step 2 — Derive the Folder Name

Generate the drill folder name from the drill `name` field:

- Lowercase all letters
- Replace spaces with hyphens
- Replace non-ASCII characters with ASCII equivalents (e.g. `é` → `e`)
- Remove any characters that are not alphanumeric or hyphens
- Example: `"Rim Stop – Cut Across"` → `rim-stop-cut-across`

The full drill path is `drills/{folder-name}/`.

## Step 3 — Build `drill.yml`

Create `drills/{folder-name}/drill.yml` using the field mapping below.

### Field Mapping

| Issue field | YAML key | Notes |
|---|---|---|
| Name | `name` | String |
| Description (Optional) | `description` | Omit entirely if blank; use `\|-` block scalar for multi-line |
| Drill Steps | `drill_steps` | Array — split on newlines, skip blank lines, strip leading `- ` or `* ` if present |
| Coaching Focus Points | `coaching_focus_points` | Array — same rules as drill_steps |
| Shooter Focus Points (Optional) | `shooter_focus_points` | Array — omit entirely if blank |
| Video (Optional) | `video` | Omit if blank; must be HTTPS YouTube or Vimeo URL |
| Drill Creation Date | `drill_creation_date` | YYYY-MM-DD string |
| Tags - Skill Level | `tags.skill_level` | Array of checked values |
| Tags - Team Drill | `tags.team_drill` | Plain string `yes` or `no` — NOT a list |
| Tags - Age Level | `tags.age_level` | Array of checked values |
| Tags - Fundamental Skill | `tags.fundamental_skill` | Array of checked values |
| Tags - Skating Skill | `tags.skating_skill` | Array of checked values |
| Tags - Game Situations (Optional) | `tags.game_situations` | Array — omit entirely if none checked |
| Tags - Equipment | `tags.equipment` | Array of checked values |
| Drill Diagram | `drill_image` | See Step 4; value is the derived filename string |
| Progression [#] Name + Description | `drill_progressions` | See progressions rules below |

### Progressions Rules

- Build `drill_progressions` from Progression 1–8 fields (up to 8 entries)
- Include a progression entry **only when both** `progression_name` and `progression_description` are provided
- If no valid progressions exist, omit `drill_progressions` entirely
- If a progression description contains an attached or pasted image URL (GitHub CDN link):
  - Download the image file
  - Save it to `drills/{folder-name}/progression-{N}.{ext}` (e.g. `progression-1.png`)
  - Set `progression_image: progression-{N}.{ext}` on that progression entry
  - Remove the raw image URL from `progression_description`
- If a progression description has no image, omit `progression_image` for that entry

```yaml
drill_progressions:
  - progression_name: Progression 1
    progression_description: Description text here.
```

### YAML Authoring Rules

- Use `yaml.FAILSAFE_SCHEMA` compatibility: **quote any string value that contains a colon** to prevent parse errors
- `drill_image` is a **single filename string**, not an array
- Omit optional fields entirely when blank — do not leave commented-out placeholders
- Do not add `drill_updated_date` for new drills

### Allowed Tag Values Reference

| Tag group | Allowed values |
|---|---|
| `skill_level` | `beginner`, `intermediate`, `advanced` |
| `team_drill` | `yes`, `no` |
| `age_level` | `all`, `10U_below`, `12U`, `14U`, `16U_and_older` |
| `fundamental_skill` | `skating`, `positioning`, `stance`, `save_selection`, `rebound_control`, `recovery` |
| `skating_skill` | `shuffle`, `t_push`, `c_cut`, `butterfly`, `power_push` |
| `game_situations` | `power_play`, `penalty_kill`, `net_front_traffic`, `dump_in`, `stick_handling` |
| `equipment` | `blaze_pods`, `cones`, `ice_marker`, `bumpers`, `none` |

## Step 4 — Handle the Drill Image

The main drill image comes from the **Drill Diagram** field of the issue.

1. If the **Drill Diagram** field contains an attached image URL:
   - Download the image
   - Save it to `drills/{folder-name}/{folder-name}.{original-extension}` (e.g. `rim-stop-cut-across.png`)
   - Set `drill_image: {folder-name}.{ext}` in `drill.yml`
   - Verify the saved file is a real image
2. If the **Drill Diagram** field is blank or contains no image, **omit `drill_image` from `drill.yml` entirely** and continue — drill images are not required.

## Step 5 — Validate

Before building:

- If `drill_image` is set, confirm the filename matches the actual file in the drill folder
- If `progression_image` is set on any progression, confirm each file exists in the drill folder
- Confirm `video` (if present) is a valid HTTPS YouTube or Vimeo URL matching accepted formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://vimeo.com/NUMERIC_ID`
- Confirm `drill_creation_date` is a valid YYYY-MM-DD calendar date
- Confirm `team_drill` is a plain string (`yes` or `no`), not a list
- Confirm all tag values are from the allowed values listed above
- Confirm no required fields are missing (`name`, `drill_steps`, `coaching_focus_points`, `tags`, `drill_creation_date`)

Then run a build to confirm the drill passes Gatsby's build-time validation:

```
npm run build
```

If the build fails with a drill validation error, fix the YAML and rebuild.

## Step 6 — Open a PR

1. Create a new branch named `drill/{folder-name}`
2. Stage only the new drill folder (`drills/{folder-name}/`)
3. Commit with message: `Add drill: {Drill Name}`
4. Push the branch and open a PR targeting `main`
5. In the PR description include:
   - A screenshot of the rendered drill page (use Playwright MCP against the local dev server)
   - An attached PDF of the drill printout (use the drill's Download PDF button via Playwright)
6. Post the PR URL as a comment on the original GitHub issue

## Example `drill.yml` Output

```yaml
---
name: Rim Stop Cut Across

drill_steps:
  - Start in ready position at the post.
  - On whistle, execute a rim stop then push across to the opposite post.

coaching_focus_points:
  - Maintain depth on the push across.
  - Keep head and eyes up tracking the puck.

drill_image: rim-stop-cut-across.png

drill_creation_date: 2025-03-14

tags:
  skill_level:
    - intermediate
  team_drill: no
  age_level:
    - 14U
    - 16U_and_older
  fundamental_skill:
    - skating
    - positioning
  skating_skill:
    - c_cut
    - t_push
  equipment:
    - ice_marker
```
