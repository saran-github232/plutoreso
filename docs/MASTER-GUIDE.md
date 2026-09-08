# PlutoReso Digital Products Platform
## Master Guide

**Project:** PlutoReso  
**Purpose:** Production-ready digital-products e-commerce platform  
**Primary market:** India  
**Initial currency:** INR  
**Payment gateway:** Razorpay  
**Current digital delivery storage:** Google Drive  
**Primary acquisition channel:** Meta Ads  
**Development:** AI-assisted / vibe-coded  
**Source of truth:** This document

---

## 1. Project Vision

PlutoReso is a digital-products e-commerce platform designed to replace the current manual WhatsApp-based selling process.

### Current process

Meta Ad → WhatsApp → Manual conversation → Payment → Manual verification → Manual delivery

### Target process

Meta Ad → PlutoReso website → Browse products → Product details → Cart → Razorpay → Server-side verification/webhook → Order confirmed → Entitlement created → Secure product access → Google Drive content

The goal is not just a beautiful website. It is a reliable digital-commerce system that can automate sales and delivery while remaining maintainable and scalable.

---

## 2. Core Business Requirements

The owner must be able to manage the store without changing source code for normal product operations.

Admin capabilities should include:

- Add products
- Edit products
- Archive/deactivate products
- Activate products
- Product images
- Product descriptions
- Pricing
- Compare-at/original price
- Categories
- Features and benefits
- Sample videos/content
- Google Drive delivery source
- Featured products
- Best sellers
- Bundles
- Bonus products
- Coupons
- Orders
- Customers
- Payments
- Testimonials
- Website content/settings
- Analytics
- Policies

**Fundamental rule: products must never be hardcoded as the permanent product system.**

---

## 3. Product Model

A product should conceptually contain:

- ID
- Name
- Slug
- Short description
- Full description
- Product image
- Price
- Compare-at price
- Category
- Features
- Benefits
- Sample videos
- Preview content
- Google Drive folder ID
- Product status
- Featured status
- Best-seller status
- Sort order
- SEO title
- SEO description
- Created at
- Updated at

Future/optional fields may include tags, testimonials, FAQs, limited offers, coupon eligibility, bundle eligibility and analytics metadata.

---

## 4. Google Drive Strategy

Google Drive is the initial storage location because the existing digital products are already stored there and may contain many PDFs, videos and other files.

Recommended organization:

Google Drive
- PlutoReso Products
  - Product A
    - PDFs
    - Videos
    - Other files
  - Product B
    - PDFs
    - Videos
  - Bonus Product
    - Files

One product can correspond to one Google Drive folder.

The application should store a validated Google Drive **folder ID** behind the scenes.

The admin interface should allow the owner to paste a complete Google Drive folder URL. The backend should validate it, extract the folder ID and associate it with the selected product.

The owner does NOT need to give all products to the AI before development and does NOT need to train the AI on product content. The AI builds the management system; the owner populates products through the Admin Panel after deployment.

---

## 5. Google Drive Security

Do not expose raw product Drive URLs publicly on product pages.

A customer must not receive product access simply because they reached a frontend success page.

Required conceptual flow:

Customer purchases product
→ payment is verified server-side
→ order is marked paid
→ entitlement is created
→ customer identity/access is checked
→ backend determines the purchased product
→ authorized access/delivery is provided

The architecture should keep storage access behind an entitlement/delivery layer.

Google Drive is acceptable for the initial stage, but the storage layer should be abstracted so it can later be replaced by object storage such as S3-compatible storage, Cloudflare R2 or another suitable provider without rewriting the entire commerce system.

---

## 6. Website Design

The website must be:

- Mobile-first
- Fully responsive
- Optimized for Meta Ads mobile traffic
- Responsive on tablet, laptop and desktop
- Fast
- Accessible
- Premium-looking
- Conversion-focused

### Visual direction

Use a polished premium digital-products aesthetic:

- Premium typography
- Modern font pairing
- Strong visual hierarchy
- High-quality product cards
- Clean spacing
- Premium buttons
- Subtle micro-interactions
- Controlled animations
- Modern icons
- Strong product imagery
- Carefully used gradients
- Premium cards
- Clear CTA hierarchy
- Excellent mobile navigation

Do not overuse animation or visual effects. Premium should not mean slow or cluttered.

---

## 7. Homepage

Recommended structure:

1. Header
2. Hero
3. Value proposition
4. Featured products
5. Best sellers
6. Bundles
7. Why PlutoReso
8. Benefits
9. Testimonials/social proof
10. Special offer where appropriate
11. FAQ
12. WhatsApp support
13. Footer

Exact sections can evolve during implementation.

---

## 8. Product Cards

A product card should communicate quickly:

- Product image
- Product name
- Short description
- Selling price
- Original/compare price when applicable
- Discount indicator
- Key benefit
- View Details
- Add to Cart

Mobile should prioritize image, name, price and CTA.

---

## 9. Product Detail Page

Recommended content:

- Product image
- Title
- Pricing
- Discount
- Short description
- Full description
- Benefits
- What's included
- Sample videos
- Preview content
- Who it is for
- Why buy
- Testimonials
- FAQ
- Add to Cart
- Buy Now

Where practical, these should be manageable through the Admin Panel.

---

## 10. Cart and Checkout

Cart:

- Add product
- Remove product
- Subtotal
- Discounts
- Coupon
- Bundle pricing
- Final total

Digital products generally should not allow meaningless duplicate quantities unless a future business rule requires licenses.

Checkout should be simple and low-friction.

Potential fields:

- Name
- Email
- Phone

Then:

- Order summary
- Payment

---

## 11. Razorpay Payment Architecture

Required conceptual flow:

Frontend
→ Backend creates Razorpay order
→ Frontend opens Razorpay Checkout
→ Customer pays
→ Razorpay returns payment information
→ Backend verifies payment signature
→ Webhook is validated and processed
→ Database order state is updated
→ Entitlements are created
→ Customer receives access

**Never trust frontend payment success alone.**

Razorpay documentation requires server-side signature verification and webhook validation.

Use Razorpay Test Mode during development and only move to live keys after proper activation and testing.

---

## 12. Razorpay Secrets

Private credentials must remain server-side.

Examples:

- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

The secret must never be exposed in frontend code, committed to GitHub or placed in publicly visible environment variables.

---

## 13. Razorpay Webhooks

Create a backend webhook endpoint, for example:

`POST /api/webhooks/razorpay`

Webhook handling must:

1. Receive the raw request body where required
2. Validate the Razorpay webhook signature
3. Identify the event
4. Validate the related order/payment
5. Check idempotency
6. Update payment/order state
7. Create entitlements only once
8. Log the event
9. Return the correct response

Webhook retries must not create duplicate fulfillment.

---

## 14. Order States

Recommended states:

- PENDING
- PAYMENT_INITIATED
- PAID
- FULFILLED
- FAILED
- CANCELLED
- REFUNDED
- PARTIALLY_REFUNDED

Never create a product entitlement for an unverified payment.

---

## 15. Entitlements

An entitlement means that a customer/order is authorized to access a particular product.

Example:

Customer
→ Order #1001
→ Product A
→ Entitlement
→ Authorized access

If an order contains three products, the system should create appropriate entitlements for all purchased products.

---

## 16. Bundles and Bonuses

The admin must be able to configure flexible bundle and bonus rules.

Example:

Customer buys:
- Product A
- Product B
- Product C

Then:

Bonus:
- Product D

Do not hardcode business rules such as `A+B+C = D`.

Instead use configurable database-driven rules:

Bundle Rule
- Trigger products
- Bonus product
- Active/inactive
- Conditions

This allows future promotional campaigns without changing application code.

---

## 17. Admin Panel

Recommended sections:

- Dashboard
- Products
- Categories
- Orders
- Customers
- Bundles
- Bonus Rules
- Coupons
- Payments
- Testimonials
- Sample Content
- Analytics
- Website Settings
- Policies
- Admin Profile
- Security

---

## 18. Admin Product Creation

Admin should be able to create a product with:

- Product name
- Slug
- Product image
- Short description
- Full description
- Price
- Compare price
- Category
- Features
- Benefits
- Sample videos
- Google Drive URL
- Product status
- Featured status
- Best-seller status
- SEO title
- SEO description

When saved:

Admin input
→ Backend validation
→ Drive URL validation/extraction
→ Folder ID stored
→ Product stored in database
→ Storefront displays the product if active

---

## 19. Product Management

Admin should support:

- Create
- Read
- Update
- Archive
- Activate
- Deactivate
- Feature
- Unfeature

Prefer soft deletion/archive for products referenced by historical orders.

---

## 20. Admin Dashboard

Recommended metrics:

- Total sales
- Today's sales
- Orders
- Successful payments
- Failed payments
- Products sold
- Top products
- Recent orders
- Recent customers
- Revenue trend

Future:

- Conversion rate
- Average order value
- Cart abandonment
- Traffic sources
- Meta Ads revenue
- Google Ads revenue

---

## 21. Customer Accounts

The architecture should support customers seeing:

- Purchases
- Product access
- Order history
- Order details
- Profile

A lightweight MVP may use verified email/order access if appropriate, but the architecture should be ready for proper customer authentication.

---

## 22. Authentication and Authorization

Admin authentication is mandatory.

Use:

- Secure authentication
- Password hashing
- Secure sessions/cookies where applicable
- Rate limiting
- Authorization checks
- Admin role enforcement

Do NOT implement admin authentication using a frontend-only password.

Backend authorization is mandatory even when frontend routes are protected.

---

## 23. Database

Recommended:

**Supabase PostgreSQL**

Use the database as the source of truth for:

- Products
- Customers
- Orders
- Payments
- Entitlements
- Bundles
- Coupons
- Admins
- Webhook events
- Settings
- Audit logs

Suggested core tables:

- admins
- customers
- products
- categories
- product_media
- orders
- order_items
- payments
- entitlements
- bundle_rules
- bundle_rule_products
- coupons
- coupon_redemptions
- webhook_events
- testimonials
- site_settings
- audit_logs

Add tables only when justified by requirements.

---

## 24. API Architecture

Example endpoints:

- `/api/products`
- `/api/products/:id`
- `/api/cart`
- `/api/orders`
- `/api/orders/:id`
- `/api/payments/create-order`
- `/api/payments/verify`
- `/api/webhooks/razorpay`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/admin/products`
- `/api/admin/orders`
- `/api/admin/customers`
- `/api/admin/bundles`
- `/api/admin/coupons`

Exact endpoint naming can be refined during implementation.

---

## 25. Backend Security

Implement:

- Input validation
- Authentication
- Authorization
- Rate limiting
- CORS restrictions
- Security headers
- Request size limits
- Secure error handling
- Logging
- Parameterized database queries/ORM protections
- Secure cookies where applicable
- CSRF protection where applicable
- Payment signature verification
- Webhook signature verification

Production CORS should allow only trusted frontend origins.

---

## 26. Delivery and Email

After verified payment:

Payment confirmed
→ Order confirmation
→ Entitlement creation
→ Access page
→ Transactional email

Email can contain:

- Customer name
- Order number
- Purchased products
- Access button
- Support contact

Recommended email events:

- Order confirmation
- Payment confirmation
- Product access
- Failed payment
- Refund
- Admin order notification

---

## 27. Digital Delivery Policy

Because these are digital products, clearly explain:

- Products are digitally delivered
- No physical shipping
- How access is provided
- Expected delivery timing
- What happens if payment succeeds but delivery fails
- Support process
- Refund/cancellation conditions

Policy wording must accurately reflect the actual business.

---

## 28. Website Policy Pages

At minimum plan for:

- Privacy Policy
- Terms & Conditions
- Refund & Cancellation Policy
- Digital Delivery / Shipping Policy
- Contact Us

Recommended:

- About Us
- FAQ

These pages should be accurate and available before Razorpay live activation/website review.

---

## 29. International Payments

International payments are not Phase 1.

Phase 1:

- India
- INR
- Domestic payments

Later:

- International payment activation
- International cards
- Currency handling
- Tax/compliance review
- Razorpay international requirements

Do not enable international payments simply by adding a frontend option.

---

## 30. Hosting Architecture

Recommended initial production architecture:

Domain:
Hostinger

Frontend:
Vercel

Backend:
Render

Database:
Supabase PostgreSQL

Storage:
Google Drive

Payments:
Razorpay

Source control:
GitHub

Marketing:
Meta Ads initially, Google Ads later

Conceptual flow:

Internet
→ Custom Domain
→ Vercel Frontend
→ HTTPS API
→ Render Backend
→ Supabase / Razorpay / Google Drive

The customer should normally interact with the custom PlutoReso domain, not the Render backend URL.

---

## 31. Domain

Example:

`plutoreso.com`

or

`plutoreso.in`

The domain can be purchased through Hostinger and connected to the frontend hosting provider using DNS configuration.

The Vercel deployment URL remains useful for development/testing.

---

## 32. Vercel and Render

Preferred separation:

Frontend → Vercel  
Backend → Render

Benefits:

- Clear separation
- Independent deployment
- Easier debugging
- Independent scaling
- Cleaner security boundaries

Both frontend and backend can technically be hosted through Render, but the separated Vercel + Render architecture is the preferred baseline unless deployment testing shows a reason to change it.

Before purchasing a production plan, verify current commercial-use terms and pricing for the selected services.

---

## 33. GitHub Repository

Recommended structure:

```text
plutoreso/
├── frontend/
├── backend/
├── docs/
│   └── MASTER-GUIDE.md
├── README.md
├── .gitignore
└── package.json
```

Optional shared types can be introduced later.

---

## 34. Deployment

### Frontend

GitHub repository
→ Vercel
→ Root Directory = `frontend`
→ Build
→ Production

Frontend environment variables may contain public configuration such as the backend API URL.

Never expose private secrets through frontend environment variables.

### Backend

GitHub repository
→ Render
→ Root Directory = `backend`
→ Install dependencies
→ Build
→ Start
→ Backend live

Backend environment variables contain private credentials and secrets.

---

## 35. Environment Management

At minimum maintain:

- Local/development environment
- Production environment

Never commit:

- `.env`
- `.env.local`
- Production secrets
- Private service-account credentials
- API secrets

to GitHub.

---

## 36. SEO

Product pages should support:

- SEO title
- Meta description
- Canonical URL
- Open Graph image
- Structured metadata where useful
- Clean product slugs

Example:

`/products/freelancing-master-bundle`

rather than random public IDs.

---

## 37. Sales and Conversion Features

Recommended:

- Testimonials
- Social proof
- Best sellers
- Bundles
- Bonus products
- Coupons
- Limited offers when truthful
- WhatsApp support
- FAQ
- Cross-sells
- Upsells later
- Related products
- Recently viewed products later

Do not use fake testimonials, fake scarcity or fake countdowns.

---

## 38. WhatsApp

WhatsApp should remain a support channel rather than the entire sales infrastructure.

Website should provide a WhatsApp support CTA.

The primary automated flow should be:

Ad → Website → Checkout → Payment → Delivery

---

## 39. Analytics and Advertising

### Meta Ads

Initial acquisition channel.

Track appropriate events such as:

- PageView
- ViewContent
- AddToCart
- InitiateCheckout
- Purchase

Purchase tracking should be tied to actual verified transactions as much as practical.

Consider Meta Pixel and Conversions API as the implementation matures.

### Google Ads

Add later for high-intent search traffic.

Meta is especially useful for discovery, visual products and social/interest-based advertising.

Google Search is especially useful for users already searching for relevant products/problems.

---

## 40. Performance

Target:

- Fast mobile loading
- Optimized images
- Lazy loading
- Minimal unnecessary JavaScript
- Code splitting
- CDN delivery
- Responsive images
- Efficient API calls
- Small frontend bundles

Meta Ads traffic makes mobile performance especially important.

---

## 41. Accessibility

Implement:

- Semantic HTML
- Keyboard accessibility
- Proper labels
- Alt text
- Focus states
- Good contrast
- Accessible forms
- Accessible buttons
- Screen-reader-friendly structure

---

## 42. Error Handling

User-facing errors should be understandable.

Example:

“Something went wrong while processing your request. Please try again or contact support.”

Technical details should go to logs rather than being exposed to customers.

---

## 43. Payment Failure

If payment fails:

- Do not create entitlement
- Preserve cart where practical
- Allow retry
- Clearly explain status

---

## 44. Payment Success

After verified payment:

- Payment confirmed
- Order created/updated
- Entitlement created
- Email sent
- Access page displayed

Show:

- Order number
- Purchased products
- Access products
- Support

---

## 45. Refunds

Refund flow should update order/payment state and handle entitlement state appropriately.

Example:

Paid
→ Refund request
→ Admin review
→ Razorpay refund
→ Order refunded
→ Access state handled according to business policy

---

## 46. Audit Logs

Important admin actions should be recorded:

- Admin login
- Product creation
- Product editing
- Product archive
- Price changes
- Bundle changes
- Coupon creation
- Refund processing
- Settings changes

---

## 47. Backups

Before significant revenue depends on the platform, establish a database backup/recovery strategy.

Do not assume a free service tier provides the level of backup/recovery required for a production business.

---

## 48. AI Coding Agent Rules

Every coding agent must first:

1. Read `docs/MASTER-GUIDE.md`
2. Analyze and understand the entire Master Guide
3. Inspect the current repository and existing implementation
4. Understand what has already been built
5. Identify the current project state
6. Follow only the development prompt for the current phase
7. Avoid automatically moving to the next phase
8. Preserve working functionality
9. Implement and test the requested changes
10. Update relevant documentation/status files after the phase
11. Report what was completed, what remains and any blockers

The agent must not silently change the architecture.

If it believes a different approach is better, it should explain the proposal and wait for approval before changing the established architecture.

---

## 49. AI Development Principle

The AI agent builds the system.

The owner supplies real business data through the Admin Panel.

Therefore:

**Do not preload or hardcode actual products unless explicitly requested.**

The final platform should allow the owner to add product image, title, description, price, sample content and Drive folder URL after the Admin Panel is ready.

No AI training is required for normal product population.

---

## 50. Development Phases

The implementation can be organized into phases such as:

1. Project foundation
2. Frontend architecture and design system
3. Database and backend foundation
4. Admin authentication
5. Admin product management
6. Storefront and product pages
7. Cart and checkout
8. Razorpay integration
9. Webhook and payment verification
10. Entitlements and digital delivery
11. Bundles, bonuses and coupons
12. Email notifications
13. SEO and analytics
14. Security hardening
15. Testing
16. Deployment
17. Production verification
18. Meta Ads tracking
19. Launch optimization

The exact phase boundaries may be refined during development.

---

## 51. Testing Requirements

### Products

- Create
- Edit
- Archive
- Activate
- Deactivate

### Cart

- Add
- Remove
- Pricing
- Discounts
- Coupon
- Persistence

### Payments

- Successful payment
- Failed payment
- Cancelled payment
- Duplicate webhook
- Invalid webhook signature
- Invalid payment signature

### Delivery

- Correct product access
- Unauthorized access blocked
- Wrong product access blocked
- Invalid entitlement handled

### Admin

- Login
- Logout
- Unauthorized access
- Session expiry
- Permission checks

---

## 52. Production Checklist

Before launch:

- [ ] Domain connected
- [ ] HTTPS active
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Database configured
- [ ] Production environment variables configured
- [ ] Razorpay live account activated
- [ ] Razorpay website review completed
- [ ] Policies published
- [ ] Webhook configured
- [ ] Webhook signature verified
- [ ] Payment signature verified
- [ ] Test purchase completed
- [ ] Entitlement verified
- [ ] Product access verified
- [ ] Email delivery verified
- [ ] Admin security verified
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] SEO configured
- [ ] Analytics configured
- [ ] Meta tracking configured
- [ ] Error logging configured
- [ ] Backup/recovery strategy established

---

## 53. Scope Control

Do not build every possible feature in Phase 1.

Avoid unnecessary initial complexity such as:

- Native mobile app
- Marketplace
- Multi-vendor system
- Complex subscription engine
- Advanced affiliate engine
- Custom payment gateway
- Enterprise CRM
- Complex AI chatbot
- Advanced recommendation engine

The first goal is:

**Reliable automated digital-product sales.**

---

## 54. Primary Success Metric

The first definition of success is:

Ad
→ Website
→ Product
→ Cart
→ Payment
→ Verification
→ Delivery

with minimal manual intervention.

---

## 55. Future Growth

Once the core platform is stable, possible additions include:

- Advanced bundles
- Memberships
- Subscriptions
- Affiliate program
- Referral system
- Upsells
- Cross-sells
- Advanced analytics
- Automated support
- International payments
- Object-storage migration
- Customer loyalty system

Build the foundation so these can be added without rewriting the core commerce system.

---

## 56. Final Architecture Baseline

```text
                    META ADS
                       |
                       v
                +--------------+
                |  PlutoReso   |
                | Custom Domain|
                +------+-------+
                       |
                       v
                    VERCEL
                   FRONTEND
                       |
                    HTTPS API
                       |
                       v
                    RENDER
                   BACKEND
                       |
          +------------+-------------+
          |            |             |
          v            v             v
      SUPABASE      RAZORPAY    GOOGLE DRIVE
      PostgreSQL     Payments     Digital Files
          |
          v
    Products
    Customers
    Orders
    Payments
    Entitlements
    Bundles
    Coupons
    Admin
```

---

## 57. Final Source-of-Truth Rule

This Master Guide is the baseline for the PlutoReso project.

If architecture or business requirements change later, update the guide intentionally and then use the updated guide as the source of truth.

AI coding agents must not silently replace:

- Database architecture
- Payment architecture
- Authentication
- Storage strategy
- Deployment architecture
- Security model

without explicit approval.

---

# FINAL AI INSTRUCTION

You are working on the PlutoReso Digital Products Platform.

This Master Guide is the project's source of truth.

Before executing any development work, read and understand this complete document.

Do not blindly implement every feature described here at once.

For each development phase:

- Inspect the existing repository first.
- Understand what has already been completed.
- Follow only the current phase prompt.
- Do not automatically continue to future phases.
- Do not hardcode real products.
- Do not expose secrets.
- Do not trust frontend payment success.
- Do not grant product access until payment verification is properly completed.
- Keep Google Drive delivery behind the backend/entitlement architecture.
- Maintain a premium, mobile-first responsive UI.
- Preserve existing working functionality.
- Test the implementation.
- Update project status/documentation as requested by the current phase.
- Clearly report completed work, current state, files changed, tests performed and remaining issues.

The goal is a production-ready PlutoReso digital-products commerce platform, not a throwaway prototype.
