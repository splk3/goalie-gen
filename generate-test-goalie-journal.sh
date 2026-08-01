#!/usr/bin/env bash
# Generate the documented sample goalie journal.
npx tsx generate-test-goalie-journal.ts \
	--name "Greg Goldberg" \
	--team "Delaware Stars" \
	--logo static/images/test/logos/stars.jpg \
	--goalie-photo static/images/test/goalie-headshot.png \
	--primary "#1b3a19" \
	--secondary "#b59b3f" \
	--out stars-goalie-journal.pdf
