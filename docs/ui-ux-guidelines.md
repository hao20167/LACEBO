# LACEBO UI/UX Guidelines & Component Library

This document outlines the core design tokens, user experience guidelines, responsive layouts, and the reusable component library for the **LACEBO** client application.

---

## 🎨 Design Tokens & System Colors

LACEBO uses a premium dark-themed color palette with primary violet-indigo accents, styled via **Tailwind CSS**.

### 1. Colors

| Token Name | Tailwind Class | HEX Equivalent | Usage Description |
| :--- | :--- | :--- | :--- |
| **Deep Dark** | `bg-dark-950` | `#0b0f19` | Absolute background for the web app body. |
| **Surface Dark** | `bg-dark-900` | `#111827` | Base card and section containers background. |
| **Interactive Dark** | `bg-dark-800` | `#1f2937` | Input fields, dropdown lists, button hover backgrounds. |
| **Border Dark** | `border-dark-700` | `#374151` | Subtle container lines and separator rules. |
| **Primary Accent** | `text-primary-400` / `bg-primary-600` | `#818cf8` / `#4f46e5` | Core brand identity: buttons, links, active tab indicator. |
| **Success Green** | `text-green-300` / `bg-green-900/50` | `#86efac` | Approved statuses, confirmation toasts. |
| **Error/Danger Red** | `text-red-300` / `bg-red-900/30` | `#fca5a5` | Error validation alerts, delete confirmation buttons. |

### 2. Typography
- **Primary Font**: Modern sans-serif default, using Inter or system defaults.
- **Sizes**:
  - `text-3xl font-bold` for main page headers (e.g. Explore Worlds).
  - `text-lg font-semibold` for card headers.
  - `text-sm` for secondary details, description text, and buttons.
  - `text-xs` for badges, tags, and datetimes.

---

## 🧭 UX/UI Guidelines & Standards

> [!IMPORTANT]
> To maintain visual excellence and prevent layout shift or locking, developers must strictly adhere to these UX rules.

### 1. Loading Transitions
- **No Text Placeholders**: Never display a blank screen or a plain text "Loading..." string.
- **Skeleton Screens**: All data-fetching components must mount a corresponding **Skeleton loader** immediately. The loader must match the final layout structure.
- **Shimmer Animations**: Skeletons must utilize the animated shimmer overlay `before:animate-shimmer` to convey activity to the user.

### 2. Error & Feedback Handling
- **No Blocking Alerts**: `window.alert()` is strictly prohibited as it halts the main thread and ruins user immersion.
- **Toast Alerts**: Use the non-blocking toast notification system. Show a brief green check for success and red warnings for errors.
- **Auto-dismiss**: Toasts must self-dismiss after 4 seconds to avoid cluttering screen space.

### 3. Responsiveness Standards
- **Vertical Stacking**: Flex layout containers that show side-by-side elements on desktop must wrap or stack vertically on mobile screens using `flex-col sm:flex-row gap-3`.
- **Grids**: Card grids should scale dynamically:
  - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for general feeds (Worlds).
  - `grid-cols-1 md:grid-cols-2` for wider, detailed card formats.
- **Margins**: Mobile layouts must retain a safe margin of `px-4` or `px-6` from screen boundaries to prevent content truncation.

---

## 📦 Component Library

Here are the details and implementation guidelines of LACEBO's reusable UI components.

### 1. Skeleton Screen Components
Located at: [SkeletonLoader.jsx](file:///c:/Users/dell_/LACEBO/client/src/components/SkeletonLoader.jsx)

Standardized skeletons utilizing pulse effects and sweeping shimmer gradients.

#### Base Shimmer Block (`Skeleton`)
A generic shimmer box that can wrap into any size using Tailwind classes.
```jsx
import Skeleton from '../components/SkeletonLoader';

// Example: Render a custom 200px wide avatar skeleton
<Skeleton className="w-12 h-12 rounded-full" />
```

#### Page Skeletons
Use these for specific routes during fetch cycles:
- **`WorldListSkeleton`**: Mimics search inputs and world detail cards.
- **`WorldDetailSkeleton`**: Mimics world header, tab menu, and timeline.
- **`EventDetailSkeleton`**: Mimics event descriptions, comments, and posts.
- **`UserProfileSkeleton`**: Mimics user card information and joined worlds.
- **`WorldManageSkeleton`**: Mimics pending member lists.

---

### 2. Pagination Controls
Located at: [Pagination.jsx](file:///c:/Users/dell_/LACEBO/client/src/components/Pagination.jsx)

Provides high-quality paging bars with range ellipsis (`...`) and click handlers.

#### Usage:
```jsx
import Pagination from '../components/Pagination';

<Pagination
  page={currentPage}
  totalPages={data.pagination.totalPages}
  onPageChange={(nextPage) => handlePageChange(nextPage)}
  hasNextPage={data.pagination.hasNextPage}
  hasPrevPage={data.pagination.hasPrevPage}
/>
```

#### Props Reference:
| Prop Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `Number` | Yes | The current active page number (1-indexed). |
| `totalPages` | `Number` | Yes | Total page count available. |
| `onPageChange` | `Function` | Yes | Callback function when a user selects a page: `(pageNumber) => void`. |
| `hasNextPage` | `Boolean` | Yes | Flag to toggle the "Next" button activity state. |
| `hasPrevPage` | `Boolean` | Yes | Flag to toggle the "Prev" button activity state. |

---

### 3. Toast Notifications
Hook location: [useToast.js](file:///c:/Users/dell_/LACEBO/client/src/hooks/useToast.js)  
UI Component: [Toast.jsx](file:///c:/Users/dell_/LACEBO/client/src/components/Toast.jsx)

Provides clean non-blocking overlays at the bottom of the screen.

#### Usage:
```jsx
import { useToastContext } from '../components/Toast';

export default function MyComponent() {
  const toast = useToastContext();
  
  const handleAction = async () => {
    try {
      await saveStuff();
      toast.success('Successfully saved changes!');
    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
    }
  };
}
```

#### Methods:
- `toast.success(message)`: Displays a success alert with green highlights.
- `toast.error(message)`: Displays an error warning alert with red highlights.
- `toast.info(message)`: Displays an informative banner.

---

### 4. Responsive Navbar
Located at: [Navbar.jsx](file:///c:/Users/dell_/LACEBO/client/src/components/Navbar.jsx)

A sticky navigation component at the top of the viewport.

#### Main Features:
- **`NavLink` helper**: Highlights matching pages automatically using route parameters, styled with ES6 default props.
- **Hamburger Switch**: Smooth animated transition toggling mobile dropdown options.
- **Dropdown List**: Fully responsive collapsing dropdown on screens smaller than `640px` (`sm:` breakpoint).
