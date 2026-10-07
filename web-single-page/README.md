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

## Enrollment flow (same as /web)

Choosing **Select plan** on the course section or on pricing opens the registration dialog. The dialog then:

1. Loads `GET /api/v1/public/programs/{slug}` to get the authoritative plan and price.
2. For new learners, calls `POST /api/v1/auth/checkout-account`. If the email or phone already exists (`409`), it asks the learner to sign in inside the dialog, and handles the `password_not_set` OTP reset there too.
3. Calls `POST /api/v1/student/lms/enrollments` and then `POST /api/v1/student/lms/payments/checkout`.
4. Opens the Cashfree modal (or Razorpay, Free, or Development, depending on the provider) and confirms with `POST /api/v1/student/lms/payments/verify`.

If Cashfree redirects the learner back with `?cashfree=return&order_id=…`, the page confirms that order on load.

Cashfree's `return_url` comes from the API's `Payments:FrontendBaseUrl`. Set it to this app's origin if bank or UPI redirects should come back here.
