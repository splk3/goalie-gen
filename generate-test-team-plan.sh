#!/usr/bin/env bash
# Generate the documented sample team plan.
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 10U A National" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "10U" \
	--skill "intermediate" \
	--all \
	--out delmarva-raptors-10a-national-team-plan.docx
