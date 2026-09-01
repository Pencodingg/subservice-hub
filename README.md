# Subservice Hub

"Create a simple, modern, and high-performance web application dashboard to manage, sort, and update a large dataset of approximately 10,000 records.

Core Features & Functionality:

Subservice Filtering & Sorting: The primary feature is a robust filtering and sorting system based on the 'Subservice' category. Add a prominent dropdown filter and column sorting for 'Subservice'.

Data Table with Pagination: Display the data in a clean data table. Since there are 10,000 records, you must implement pagination (e.g., 20-50 rows per page) to ensure the browser doesn't crash and performance remains fast.

Full CRUD Operations: The data requires continuous updates. Include intuitive modals/forms to Add new records, Edit existing records, and Delete records easily.

Search Bar: A quick search input to find specific records by name or ID.

Database Integration: Set up the architecture to be ready for Supabase integration. Use Supabase for backend database management so the 10,000 records can be fetched, updated, and mutated efficiently in real-time.

Data Model / Schema (Example):

id (UUID, Primary Key)

item_name (Text)

main_service (Text)

subservice (Text/Enum) -> Crucial for the sorting feature

status (Text: Active/Inactive)

last_updated (Timestamp)

UI/UX Design:

Clean, minimalist, and professional dashboard interface (using Tailwind CSS and Shadcn UI).

Responsive design that works well on both desktop and tablet.

Show loading states (skeletons or spinners) when fetching or updating data."

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://subservice-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a33d20f5-a599-47d5-a9db-7a3100fc8edd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
