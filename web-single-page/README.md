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
