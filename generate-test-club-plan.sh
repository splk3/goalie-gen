#!/usr/bin/env bash
# Generate the documented sample club plan.
npx tsx generate-test-club-plan.ts \
	--name "Brandywine Outlaws" \
	--website "https://www.facebook.com/brandywineoutlaws/" \
	--motto "The most fun you'll ever have playing summer hockey\!" \
	--logo static/images/test/logos/outlaws.jpeg \
	--primary "#081f8a" \
	--secondary "#7b7e8c" \
	--all \
	--out "brandywine-outlaws-club-plan.docx"
