# Responsive browser checks

Start the frontend on `http://localhost:5173`. These scripts use an existing
Playwright installation and Chromium; they do not install dependencies. If
Playwright is not resolvable from this repository, set `PLAYWRIGHT_MODULE` to
the absolute path of its `index.mjs`. No package or lockfile changes are needed.

From the repository root, in PowerShell:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\playwright\index.mjs'
$env:FULL = '1'
node web/scripts/responsive/public.mjs
node web/scripts/responsive/protected.mjs
node web/scripts/responsive/interactions.mjs
node web/scripts/responsive/form-states.mjs
node web/scripts/responsive/home-states.mjs
node web/scripts/responsive/certificates.mjs
node web/scripts/responsive/desktop.mjs
$env:INTERACTIONS = '1'
node web/scripts/responsive/protected.mjs
Remove-Item Env:INTERACTIONS
```

Without `FULL`, the public/protected route checks use four representative sizes.
With it, they test all 12 requested sizes and their transposed orientations.
`ONLY=Payments`, for example, filters protected route checks for targeted reruns.

Protected, form-state, and certificate checks intercept API calls with sample
responses. They do not create accounts, send OTPs, issue certificates, or charge
payments. These checks validate frontend layout and interaction, not backend
integration. Public checks also exercise the real API-unavailable fallback.

Reports and screenshots are written to the ignored root `tmp/` directory.
Layout/state scripts exit unsuccessfully for recorded failures. Desktop checks
report geometry differences with the responsive stylesheet enabled/disabled;
intentional corrections (the office/map layout) require visual review.

Public layout checks report viewport overflow outside intentional component
scroll areas and broken loaded images. Visual inspection is still necessary for
overlaps, decorative clipping, contrast, and real-device keyboard behavior.
