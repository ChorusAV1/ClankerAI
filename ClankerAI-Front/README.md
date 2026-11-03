# ClankerAI

React + TypeScript UI for an academic e-commerce decision assistant, built with Vite and Tailwind CSS. The Spanish interface follows the desktop and mobile mockups in `../References`.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The current UI runs independently of Python.

```sh
npm run build    # TypeScript checks and production build
npm run preview  # Serve the production build locally
```

## Screens and interactions

- **Resumen** (`#/resumen`): inventory KPIs, category coverage, and priority alerts that open the corresponding recommendation.
- **Predicción de demanda** (`#/demanda`): four category filters, 4/8/12-week horizons, updated demand and coverage metrics, and historical/forecast charts.
- **Recomendaciones** (`#/recs`): purchase and discount tabs, simulated approvals and rejections, pending counts, notifications, and a reset once all seven recommendations have been reviewed.
- **Desempeño del modelo** (`#/modelo`): sample model metrics, actual/predicted chart, and category error table.

Navigation supports direct links and browser back/forward. Filters and decisions remain in memory when switching screens and reset on a full reload. Tables become labeled cards on mobile. The mobile drawer supports Escape, focus trapping, focus restoration, and closing through its backdrop. Charts support pointer tooltips and keyboard exploration with Left/Right, Home/End, and Escape. Reduced-motion preferences are respected.

## Source structure

```text
src/
  App.tsx          Navigation and shared UI state
  components/      Sidebar, icons, metric cards, charts, notifications
  data/demo.ts     Typed sample data adapted from the reference mockup
  pages/           The four dashboard screens
  types.ts         Shared data and UI types
  index.css        Tailwind entry point, theme, and responsive styles
```

## Current stage

All values, recommendations, model names, and performance figures are UI fixtures. The CSV has not been loaded, no model has been trained, and no API requests are made. Login is intentionally deferred. Next stages are FastAPI endpoints with hardcoded responses, followed by the basic date-based machine-learning proof of concept. The eventual model can replace the illustrative Random Forest label and metrics from the mockup.

## Validation

The production build was checked, and the interface was exercised in headless Edge at widths from 320 to 1920 pixels. Browser checks covered all 12 category/horizon combinations, chart keyboard controls, approvals/rejections, completion/reset, alert links, direct-link refresh, browser history, mobile drawer focus behavior, responsive tables, and page overflow. No browser exceptions, console errors, or failed HTTP responses were observed.
