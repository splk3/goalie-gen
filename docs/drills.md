# Drill Database and Schema Specification

Goalie Gen houses active goaltending drills in a file-based database. This document details the folder structure, YAML validation schemas, tag categories, and media format constraints.

---

## 📁 Database Directory Structure

Drills are located in the [drills/](file:///home/patrick/github/splk3/goalie-gen/drills/) directory. Each drill requires its own dedicated subdirectory:

```text
drills/
├── crease-footwork/
│   ├── drill.yml            # Goalie drill definition file
│   └── crease-footwork.png  # Main drill diagram image
```

---

## 📄 YAML Validation Schema (`drill.yml`)

The Gatsby build process automatically validates all drills using a strict build-time schema in `gatsby-node.ts`.

### 1. Required Fields

- **`name`**: Simple text name of the drill.
- **`drill_steps`**: Markdown string list detailing step-by-step goalie instructions. Single-tier lists render as ordered steps; nested/indented sub-items render as bullets.
- **`coaching_focus_points`**: Markdown string list of core coaching cues.
- **`tags`**: Configuration object mapping the drill to search and filter options.
- **`drill_creation_date`**: ISO string formatted exactly as `YYYY-MM-DD`.

### 2. Optional Fields

- **`description`**: Markdown overview text shown at the top of the page.
- **`shooter_focus_points`**: Markdown checklist shown in the shooter focus panel.
- **`drill_image`**: Filename of the diagram image in the same directory.
- **`video`**: URL pointing to a YouTube or Vimeo video (regex validated).
- **`drill_updated_date`**: ISO string `YYYY-MM-DD`. If specified, it must not be earlier than `drill_creation_date`.
- **`drill_progressions`**: Array of up to 8 progression steps. Each progression requires:
  - `progression_name`: Markdown text.
  - `progression_description`: Markdown text.
  - `progression_image`: Optional filename string.

---

## 🏷️ Tag Categories

Filter metadata tags must conform to the following allowed values:

- **`space_required`** (Required, at least one value):
  - `full_ice`, `half_ice`, `whole_zone`, `half_zone`, `crease_only`, `flexible`
- **`team_drill`** (Required single value):
  - `yes`, `no`
- **`fundamental_skill`**:
  - `skating`, `positioning`, `stance`, `save_selection`, `rebound_control`, `recovery`
- **`skating_skill`**:
  - `butterfly`, `power_push`, `shuffle`, `t_push`, `c_cut`
- **`age_level`**:
  - `10U_below`, `12U`, `14U`, `16U_and_older`, `all`
- **`skill_level`**:
  - `beginner`, `intermediate`, `advanced`
- **`equipment`**:
  - `blaze_pods`, `bumpers`, `cones`, `ice_marker`, `none`
- **`game_situations`** (Validated at build time, not filterable in UI search):
  - `power_play`, `penalty_kill`, `net_front_traffic`, `dump_in`, `stick_handling`, `odd_man_rush`, `macro_game`, `small_sided_game`, `small_unit_play`, `opposed_practice`, `unopposed_practice`

---

## ⚠️ Important Authoring Rules

### 1. The Colon `:` Rule

Because drill YAML is parsed using `FAILSAFE_SCHEMA`, any text field containing colons `:` (e.g. `Step 1: Goalie moves to post`) **must be wrapped in single or double quotes** to prevent YAML syntax parsing crashes.

### 2. Diagram Screenshots

If a drill diagram originates from a PDF, capture a PNG/JPG screenshot of the diagram and save it in the drill directory. Do not reference raw PDF files in the `drill_image` or `progression_image` fields.

### 3. Video URL Regex Formats

Only the following URL schemes are accepted:

- **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID` (first query parameter must be `v`) or `https://youtu.be/VIDEO_ID`
- **Vimeo**: `https://vimeo.com/VIDEO_ID`
