# Asset Download Checklist

Use this checklist to ensure all logo and favicon assets are properly downloaded and installed.

## Logo Files

- [ ] `static/images/logo-dark.png` - Dark mode full logo (white goalie on transparent)
- [ ] `static/images/logo-light.png` - Light mode full logo (blue/red goalie)
- [ ] `static/images/logo-alt-dark.png` - Dark mode alternate logo (white gear with GG)
- [ ] `static/images/logo-alt-light.png` - Light mode alternate logo (red/blue gear with GG)

## Favicon Files

- [ ] `static/favicon.ico` - Main favicon file (from light mode zip)
- [ ] Optional: Additional favicon sizes in `static/favicons/` directory

## Verification Steps

After downloading assets:

- [ ] Run `npm run clean` to clear cache
- [ ] Run `npm run develop` to start dev server
- [ ] Open http://localhost:8000 in browser
- [ ] Verify logo appears in header
- [ ] Toggle dark mode - logo should change to dark variant
- [ ] Check browser tab for favicon
- [ ] Check browser console for any image loading errors

## Testing Dark Mode Logo Switch

1. Visit the site in your browser
2. Click the dark mode toggle button in the top-right
3. The logo should switch from the light (blue/red) version to the dark (white) version
4. The switch should be smooth and automatic

## Deployment

Once verified locally:

- [ ] Commit the new image files: `git add static/images/*.png static/favicon.ico`
- [ ] Commit with message: `git commit -m "Add Goalie Gen logos and favicons"`
- [ ] Push to GitHub: `git push`
- [ ] Deploy: `npm run deploy`

## Troubleshooting

### Logo not appearing
- Check that image files are in the correct directory: `static/images/`
- Check file permissions: `ls -la static/images/`
- Clear browser cache and Gatsby cache: `npm run clean`

### Dark mode logo not switching
- Verify both `logo-dark.png` and `logo-light.png` exist
- Check browser developer tools console for errors
- Ensure dark mode toggle is working (test with other elements)

### Favicon not showing
- Clear browser cache (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
- Check `static/favicon.ico` exists
- Some browsers cache favicons aggressively - try incognito/private window

## Need Help?

See `LOGO_SETUP.md` for detailed setup instructions or run `./download-assets.sh` to automatically download all assets.
