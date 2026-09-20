# Responsive audit — 21 September 2026

## Result and scope

Pulled `origin/main` through `2496503` and integrated the responsive work. The
navbar merge conflict was resolved while retaining the upstream removal of its
search icon. Changes are uncommitted; the pre-pull work also remains in a Git
stash as a recovery copy.

The site uses React 19, TypeScript, Vite, React Router, page-specific CSS, and
shared global styles. The API uses ASP.NET Core/.NET 10 and PostgreSQL. The audit
keeps the existing brand, fonts, colors, assets, and desktop layout. Corrections
are primarily in `src/styles/responsive.css`, loaded after existing styles.

## Viewports

Chromium browser emulation covered each size below **and its transposed
orientation**, for 24 viewport configurations. These are browser tests, not
tests on physical Apple or Samsung devices.

| Group | Sizes |
| --- | --- |
| Phones | 375×667, 393×852, 430×932, 360×780, 412×915 |
| Tablets | 768×1024, 820×1180, 1024×1366, 800×1280 |
| Desktop | 1280×720, 1440×900, 1920×1080 |

## Page checklist

All entries below passed the viewport matrix, including horizontal page-width
checks. Protected pages used browser-intercepted sample responses because the
local API cannot authenticate to PostgreSQL.

| Routes | Coverage |
| --- | --- |
| `/` | Hero, sections, program carousel, journey, testimonials, footer |
| `/programs` | Categories, filters, search, sort, cards, save, load more |
| `/features` | Hero, feature cards, native feature dialogs |
| `/about` | Hero, story dialog/chapters, values, stories, opportunity cards |
| `/campus-delegate` | Hero, benefits, role, application CTA, FAQ |
| `/campus-partners` | Hero, collaboration cards, process, FAQ, CTA |
| `/careers` | Hero, roles, application links, process, CTA |
| `/reviews` | Spotlight carousel, discipline filters, review cards |
| `/privacy-policy`, `/terms`, `/return-policy` | Legal content and footer |
| `/login`, `/login?role=admin` | Both login roles, registration, recovery, OTP states |
| `/request-callback` | Form, contact links, office address/map, footer |
| `/auth/callback`, `/auth/google/callback` | Callback/error presentation; no live OAuth exchange |
| `/verify/:certificateId` | API-unavailable, valid, and revoked certificate states |
| `/programs/:slug` | Every one of the 21 local programs, details, curriculum, projects, plans, FAQs, registration dialog |
| `/dev/student-dashboard` | Overview, My Program, Projects, Certificates, Payments, Notifications |
| `/dashboard` — Student | Same six sections, with populated project/payment/certificate/notification fixtures |
| `/dashboard` — Admin | Overview, Categories, Programs, Curriculum, Projects, Certificates, Students, Enrollments, Payments, Coupons, Audit Logs |
| `/profile` | Student and admin layouts; admin editing and preferences |
| `/student/onboarding` | Page matrix plus each step at representative phone, landscape, tablet, and desktop sizes |
| `/learning/:programId` | Course contents, expanded module, lesson viewer, media placeholder |
| `/checkout` | Enrollment summary and payment form; no gateway charge attempted |

Program slugs tested: `generative-ai`, `full-stack-web-development`,
`machine-learning`, `cyber-security-ethical-hacking`, `data-analytics`,
`data-science`, `cloud-computing`, `devops`, `embedded-systems`, `vlsi`,
`solidworks`, `autocad`, `hev-management`, `ui-ux-design`, `solidworks-creo`,
`finance`, `stock-market`, `digital-marketing`, `business-analytics`,
`international-business-management`, `hrm`.

## Issues corrected

- Conflicting navigation breakpoints and the Programs navbar's hidden tablet
  menu. The shared 1220px threshold now governs the expandable navigation.
  Menus fit short landscape screens, scroll internally, close on Escape/outside
  interaction, and make hidden links inert. Tablet login/callback actions remain
  directly accessible.
- Cramped mobile program cards and tiny text. Cards use one column on phones;
  category controls wrap, filter groups remain reachable, and program skills
  wrap instead of truncating. Tablet grids retain their existing multiple columns.
- The office map squeezed the mobile address into a nearly vertical column.
  Address and map now occupy separate grid rows; desktop contact content also
  avoids the overlapping absolutely positioned map.
- Mobile registration clipped its lower controls. Dialogs use dynamic viewport
  height, internal scrolling, and short-screen reflow. Shared custom-dialog
  handling contains focus, restores focus, supports Escape, and restores page
  scrolling after dismissal.
- Curriculum dialogs were positioned relative to the dashboard container and
  moved off-screen after scrolling. They now render in a document-body portal,
  retaining the admin styling context.
- Homepage registration did not reopen when its existing hash link was clicked
  again after dismissal. It now responds to the new navigation entry.
- Admin profile tabs overflowed on tablets. They now wrap. Curriculum search
  controls also no longer stretch into an oversized mobile search panel.
- Populated student payment tables expanded the entire page. Grid children can
  now shrink, with scrolling confined to the labeled, keyboard-focusable table
  container.
- Student header decorations extended beyond the page. Their own bounds were
  corrected, and page-level overflow masking was removed from the affected
  wrappers.
- Mobile form text and key touch controls were undersized. Inputs, navigation,
  carousel controls, card toggles, modal close buttons, and footer links received
  targeted sizing/focus improvements. Feature-card content can determine height.
- The newly pulled certificate screens imported a missing `CertificateArtwork`
  component. It was restored using the shipped certificate image and overlay
  classes. Overlay text scales with the artwork container, and the verification
  page wraps long identifiers and stacks its label/value rows on phones.

## Validation

- **1,056 public/preview route–viewport checks**: 44 entries × 24 configurations.
- **528 protected route–viewport checks**: 22 entries × 24 configurations.
- No horizontal page overflow in those matrices, no broken loaded public
  images, and no uncaught JavaScript errors in the recorded runs.
- 299 navigation, registration-dialog, accordion, search, save, and load-more
  assertions; 88 feature/story/auth-form state checks; 48 certificate state
  checks; 228 homepage dialog/carousel/journey/card/width assertions passed.
- Additional authenticated dropdown, editor, curriculum preview, onboarding,
  and profile state checks passed at 360×780, 780×360, 820×1180, and 1440×900.
- Desktop geometry comparison at 1440×900 found unchanged sampled heading,
  paragraph, navbar, and footer geometry on 13 public templates. The contact
  template changed intentionally to correct the office/map layout. The full
  route matrix also covered 1280px and 1920px desktop widths.
- Internal route destinations were checked against the route inventory. The
  homepage `/#register` link is an intentional dialog trigger, not an element ID.
- Frontend production build and backend build passed. Vite still reports the
  existing large-bundle advisory; bundle splitting was outside this layout work.

Repeatable scripts are in [`scripts/responsive`](scripts/responsive/README.md).
JSON results and screenshots are in the ignored repository-root `tmp/` folder.
The scripts use the existing local Playwright installation. Automatic approval
review rejected adding a dependency because of package/lockfile and network
side effects; no dependency or lockfile changes were made.

## Remaining validation limits

- Frontend is available at `http://localhost:5173`. Backend startup still fails
  with PostgreSQL `28P01` for `postgres`. Correct local database credentials are
  required for live account, enrollment, certificate issuance, and payment checks.
- External OAuth, payment provider UI, maps, email delivery, real uploads, and
  printing on physical hardware were not end-to-end validated. The restored
  certificate component uses the supplied sample artwork, including its watermark.
- Confirm physical iOS Safari and Android Chrome behavior: virtual keyboards,
  browser chrome/safe areas, touch scrolling, orientation changes, pinch zoom,
  and print output. Chromium viewport emulation cannot prove these behaviors.
- Automated geometry checks are supplemented by screenshots and code review;
  they do not constitute an exhaustive accessibility or cross-browser audit.
