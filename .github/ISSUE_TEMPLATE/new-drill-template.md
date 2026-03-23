---
name: New Drill Template
about: Use this template to submit a new drill for the site
title: Add a new drill - [DRILL NAME HERE]
labels: drills-goalie, drills-team
assignees: splk3, Copilot

---

# New Drill Template

## Instructions

This is the new drill template.  To submit a new drill, fill out the `Drill Information` section below. 
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

# youtube or vimeo only
video: https://www.youtube.com/watch?v=dQw4w9WgXcQ

# must be a valid calendar date in YYYY-MM-DD format
drill_creation_date: 2024-01-01

# optional - use if updating existing drill
drill_updated_date: 2024-06-15

# remove irrelevant tags
tags:
  skill_level:
    - beginner
    - intermediate
    - advanced
  # allowed values: yes or no (exactly one value)
  team_drill:
    - yes
  age_level:
    - all
    - 10U_below
    - 12U
    - 14U
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
