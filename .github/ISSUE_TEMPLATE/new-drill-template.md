---
name: New Drill Template
about: Use this template to submit a new drill for the site
title: Add a new drill - [DRILL NAME HERE]
labels: new-drill
assignees: splk3, copilot-swe-agent

---

# New Drill Template

## Instructions

This is the new drill template. To submit a new drill, fill out the `Drill Information` section below.
Don't forget to update the tags section to reflect the specifics of your drill.

Attach any diagrams to the issue, making sure that the `images` section matches the file names of the images that you attach.

Once you are done, submit your drill, and it will get added to the site once it is reviewed.

## Drill Information

```yaml
---
name: Drill Name

description: |-
  A brief description of the drill.  This can be multiple lines and should provide
  an overview of what the drill is about, its purpose, and any key details that
  would help someone understand what the drill entails.

coaching_points:
  - Coaching point 1
  - Coaching point 2
  - Coaching point 3

# must be a list
images:
  - test-drill-image.png

# HTTPS-only YouTube or Vimeo URL. Accepted formats:
#   https://www.youtube.com/watch?v=VIDEO_ID
#   https://youtu.be/VIDEO_ID
#   https://vimeo.com/NUMERIC_ID
video: 

# must be a valid calendar date in YYYY-MM-DD format
drill_creation_date: YYYY-MM-DD

# optional - use if updating existing drill
drill_updated_date: YYYY-MM-DD

# For each category below, remove the values that do not apply
tags:
  skill_level:
    - beginner
    - intermediate
    - advanced
  # allowed values: yes or no (select exactly one and delete the other)
  team_drill:
    - yes
    - no
  age_level:
    - all
    - 10U_below
    - 12U
    - 16U_and_older
  fundamental_skill:
    - skating
    - positioning
    - stance
    - save_selection
    - rebound_control
    - recovery
  skating_skill:
    - shuffle
    - t_push
    - c_cut
    - butterfly
    - power_push
  equipment:
    - blaze_pods
    - cones
    - goal
    - ice_marker
    - bumpers
    - none
```

## Copilot Instructions

**NOTE**: This section is for copilot use only.

Use the content in the `Drill Information` section to create a new drill.

- Create a new folder under `drills` using lowercase letters and hyphens for spaces, based on the supplied `name` field
- use the text to create the `drill.yml` file in that folder
- add the images to the folder, updating the `images` field, as needed
- submit the proposed changes as a PR
- confirm image files are actual images, and that video links are real youtube or vimeo video links
- make sure the new drill passes build validation and that the site builds properly
