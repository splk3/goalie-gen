#!/usr/bin/env bash
# Generate sample team plans for each supported age group using the Delmarva Raptors.

# 8U
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 8U Mites" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "8U" \
	--all \
	--out delmarva-raptors-8u-mites-team-plan.docx

# 10U
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 10U A National" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "10U" \
	--all \
	--out delmarva-raptors-10u-national-team-plan.docx

# 12U
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 12U B American" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "12U" \
	--all \
	--out delmarva-raptors-12u-b-american-team-plan.docx

# 14U
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 14U A American" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "14U" \
	--all \
	--out delmarva-raptors-14u-a-american-team-plan.docx

# 16U and older
npx tsx generate-test-team-plan.ts \
	--name "Delmarva Raptors 16U AA" \
	--website "https://raptorhockey.com/" \
	--motto "Fostering a love for hockey while promoting teamwork, hard work, and important life skills for players aged 4-18." \
	--logo static/images/test/logos/raptors.png \
	--primary "#56a0d3" \
	--secondary "#666666" \
	--age "16U and older" \
	--all \
	--out delmarva-raptors-16u-aa-team-plan.docx
