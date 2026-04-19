#!/usr/bin/env bash

set -euo pipefail

run_step() {
	local label="$1"
	shift

	echo "→ ${label}"
	if "$@"; then
		echo "✓ ${label} succeeded"
	else
		echo "✗ ${label} failed"
		return 1
	fi
}

main() {
	# Ensure the script runs from the repository root
	cd "$(dirname "$0")/.."
	run_step "gh extension upgrade gh-aw" gh extension upgrade gh-aw
	run_step "gh aw upgrade" gh aw upgrade
	run_step "gh aw compile" gh aw compile
	run_step "gh aw compile --validate" gh aw compile --validate

	echo "✅ All GitHub AW workflow update commands completed successfully."
}

main "$@"
