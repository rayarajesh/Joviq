# Joviq — single-page web

A standalone, single-page React front end for Joviq. It uses the **same API** as `/web`:
the same `httpClient`, the same endpoints, and the same enrollment and payment flow.

## Run

```bash
npm install
npm run dev        # http://localhost:5174 (already in the API's CORS allow-list)
npm run build
```

Configure in `.env.local` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API origin. Leave it empty to use the dev proxy. |
| `VITE_DEV_PROXY_TARGET` | Dev proxy target for `/api`. |
| `VITE_LMS_APP_URL` | The full LMS app, used for the post-payment dashboard link and legal pages. |

## Resume onboarding after payment

Share `/onboarding` on the single-page site's domain (for example,
`https://joviqtechnologieslms.com/onboarding`). The homepage's resume email field
and **Open onboarding** link both lead here, without redirecting to the LMS dashboard.
Signed-in students resume the registration form using their verified payment from
the API. Signed-out students can sign in or set/reset a password with email OTP;
Google sign-in is not required. Multiple paid enrollments are shown for selection.
Pending or failed payments do not unlock registration. No new checkout is started.
The host must serve `index.html` for `/onboarding`; Vite and the included Azure
Static Web Apps navigation fallback already do this.

After payment, the confirmation shows the verified payment reference and college.
Registration saves college and executive name in the API. The email and Google
choices then open the LMS `/student/account-setup` route with the payment reference.
Email users can create a password using email OTP; Google users proceed to the
username step. The username is the profile/display name (email remains the login).
Only after saving this name does the flow navigate to the dashboard.

Deploy the API and both frontends together, and apply EF migration
`20261017113419_AddRegistrationExecutiveName` before starting the updated API.
Set `VITE_LMS_APP_URL` to the full LMS origin and keep the Google callback pointing
to the LMS callback route, which preserves the account-setup return URL.

## Shareable checkout links

The enrollment form at the top of the page supports these direct links:

| Plan | Choose payment | Reserve | Pay in full |
| --- | --- | --- | --- |
| Launch | `/launch` | `/launch/reserve` | `/launch/full` |
| Elevate | `/elevate` | `/elevate/reserve` | `/elevate/full` |

Plan-only links select the plan and keep the standard reservation default; visitors can choose either payment option. The four payment-specific links open a modal containing the details form and countdown timer. The URL determines the plan and payment amount; the plan and payment selectors remain on the main page only. The close button or Escape dismisses the modal and returns the URL to `/`. Visitors can change either selection before submitting, and the address updates to match. These links do not submit registration or initiate payment. Hosting must serve `index.html` for these frontend routes, as the Vite development server does.

Use these paths on the deployed single-page site's domain:

| Plan | Reserve | Pay in full |
| --- | --- | --- |
| Launch | `/?plan=launch&payment=reserve` | `/?plan=launch&payment=full` |
| Elevate | `/?plan=elevate&payment=reserve` | `/?plan=elevate&payment=full` |

These links open registration immediately with the selected plan and payment option.
Clients still provide their details before payment. No personal information or payment authorization is stored in the URL.
Add `&program=<program-slug>` to target a specific course; course-card links include it automatically.
Right-click a pricing button to copy its link. Changing the payment option updates the address bar.
The plain site URL opens the landing page, and closing registration removes checkout parameters.

## Enrollment flow (same as /web)

Choosing **Select plan** on the course section or on pricing opens the registration dialog. The dialog then:

1. Loads `GET /api/v1/public/programs/{slug}` to get the authoritative plan and price.
2. For new learners, calls `POST /api/v1/auth/checkout-account`. If the email or phone already exists (`409`), it asks the learner to sign in inside the dialog, and handles the `password_not_set` OTP reset there too.
3. Calls `POST /api/v1/student/lms/enrollments` and then `POST /api/v1/student/lms/payments/checkout`.
4. Opens the Cashfree modal (or Razorpay, Free, or Development, depending on the provider) and confirms with `POST /api/v1/student/lms/payments/verify`.

If Cashfree redirects the learner back with `?cashfree=return&order_id=…`, the page confirms that order on load.

Cashfree's `return_url` comes from the API's `Payments:FrontendBaseUrl`. Set it to this app's origin if bank or UPI redirects should come back here.
