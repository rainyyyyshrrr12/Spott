🎟️ Spott — Full-Stack Event Discovery & Management Platform

Spott is a full-stack event discovery and management platform that enables users to discover events, create and manage events, book tickets, and handle event check-ins with modern UX and scalable backend architecture.

🔗 Live Demo: https://spott-psi.vercel.app/

🚀 Features

🔍 Discover Events

Browse featured and nearby events with rich visuals

Filter events by location and category

🛠️ Create & Manage Events

Event creation with date, time, location, capacity, and ticketing

Cover image selection via Unsplash

Theme color customization (Pro feature)

📂 My Events Dashboard

Organizers can view and manage all created events

Track registrations and event details

🎫 My Tickets Dashboard

Users can view all booked event tickets

Each ticket includes a unique QR code

📱 QR Code–Based Ticketing

Auto-generated QR code for every event registration

Enables seamless event check-in and verification

🔐 Authentication & Authorization

Secure user authentication using Clerk

Role-based access for Free vs Pro users

💳 Payments & Pro Subscription

Integrated Clerk Payments

Free vs Pro feature gating:

Event creation limits

Premium theme customization

⚡ Real-Time Backend

Powered by Convex for real-time data handling

Secure server-side validations

🧑‍💻 Tech Stack

Frontend: Next.js (App Router), Tailwind CSS, Shadcn UI

Backend: Convex (Database, Mutations & Queries)

Authentication & Payments: Clerk

APIs: Unsplash API, Gemini API (AI integration)

UI Inspiration: Mobbin

Deployment: Vercel

Create a .env file in the root directory and add the following:

# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk Authentication & Payments
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Unsplash API
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=

# Gemini AI
GEMINI_API_KEY=

🛠️ Installation & Setup
# Clone the repository
git clone https://github.com/your-username/spott.git

# Navigate to project
cd spott

# Install dependencies
npm install

# Start Convex backend
npx convex dev

# Run development server
npm run dev


App will be available at:
👉 http://localhost:3000

🧠 Architecture Highlights

Server-side Pro feature validation to prevent client-side abuse

Schema-validated database writes using Convex

Separation of runtime flags vs persisted data (e.g., Pro status)

Scalable event & ticket data model

📸 Screenshots

Event Discovery Page

Event Creation Flow

My Events Dashboard

My Tickets with QR Codes

(Screenshots shown above 👆)

📈 Project Status

✅ Production deployed

✅ Authentication & Payments live

✅ Real-time backend operational

🙌 Acknowledgements

Clerk for Authentication & Payments

Convex for real-time backend

Unsplash for high-quality images

Shadcn UI for component system

📄 License

This project is licensed under the MIT License.

⭐ If you like this project, don’t forget to star the repo!
