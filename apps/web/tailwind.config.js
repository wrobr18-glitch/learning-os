const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Absolute paths using __dirname — works regardless of where build runs from
    path.resolve(__dirname, "src/pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "src/app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.resolve(__dirname, "../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  // Safelist forces Tailwind to generate these classes even if scanning fails
  // This guarantees correct CSS on Vercel's monorepo build environment
  safelist: [
    // Layout
    "flex", "flex-1", "flex-col", "flex-row", "flex-wrap", "flex-shrink-0", "inline-flex",
    "grid", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4",
    "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4",
    "lg:col-span-2", "col-span-2", "col-span-3",
    "gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-1.5",
    "items-center", "items-start", "items-end", "justify-center", "justify-between", "justify-end",
    "space-y-3", "space-y-4", "space-y-6", "space-y-1.5", "space-y-3.5",
    // Sizing
    "w-full", "w-64", "w-20", "w-9", "w-10", "w-12", "w-6", "w-2", "w-5", "w-5",
    "h-full", "h-screen", "h-9", "h-10", "h-12", "h-6", "h-2", "h-5", "h-1", "h-1.5",
    "min-h-screen", "min-w-0",
    "max-w-3xl",
    // Spacing
    "p-3", "p-4", "p-5", "p-6", "px-3", "px-4", "px-5", "px-6", "py-1", "py-3", "py-4",
    "py-0.5", "py-1.5", "py-2.5", "px-2", "px-2.5",
    "mt-1", "mt-4", "mt-5", "mb-2", "mb-4", "mb-5", "ml-4", "pt-4",
    "pb-3", "pb-2",
    // Colors - backgrounds
    "bg-slate-950", "bg-slate-900", "bg-slate-800",
    "bg-cyan-600", "bg-cyan-500",
    "bg-gradient-to-r", "bg-gradient-to-br", "bg-gradient-to-tr",
    "from-cyan-600", "from-cyan-950/40", "from-cyan-500", "from-cyan-500/10",
    "to-purple-600", "to-slate-900/40", "to-emerald-500", "to-cyan-400",
    "via-slate-950/20",
    "bg-slate-950/20", "bg-slate-950/40", "bg-slate-950/70", "bg-slate-950/80",
    "bg-emerald-500/5", "bg-cyan-500/5", "bg-cyan-500/10",
    "bg-amber-500/5",
    // Colors - text
    "text-slate-100", "text-slate-200", "text-slate-300", "text-slate-400", "text-slate-500",
    "text-white", "text-cyan-400", "text-cyan-300", "text-emerald-400",
    "text-amber-400", "text-purple-400",
    "text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl",
    "text-[10px]",
    // Borders
    "border", "border-b", "border-t", "border-l-2",
    "border-white/5", "border-white/10",
    "border-cyan-400", "border-cyan-500/20", "border-emerald-500/20", "border-amber-500/20",
    "border-slate-800",
    "rounded", "rounded-xl", "rounded-2xl", "rounded-full",
    // Typography
    "font-sans", "font-mono", "font-bold", "font-black", "font-extrabold", "font-medium", "font-semibold",
    "uppercase", "tracking-wide", "tracking-wider", "tracking-widest", "tracking-tight",
    "truncate", "leading-relaxed",
    // Position
    "relative", "absolute", "fixed", "sticky",
    "top-0", "top-1/2", "right-0", "bottom-0", "left-0",
    "-right-3", "-translate-y-1/2",
    "z-10", "z-20", "z-30",
    "inset-0",
    // Display / overflow
    "block", "hidden", "overflow-hidden", "overflow-y-auto",
    "pointer-events-none",
    "select-none",
    // Effects
    "opacity-75",
    "blur-xl",
    "shadow-lg",
    "transition-all", "transition-colors",
    "duration-200", "duration-300", "duration-500", "duration-1000",
    "ease-out",
    // Hover / active
    "hover:text-white", "hover:bg-slate-900/30", "hover:border-cyan-500/20",
    "hover:bg-cyan-500/5", "hover:bg-cyan-500", "hover:-translate-y-0.5",
    "hover:text-purple-300",
    "active:translate-y-0",
    "group", "group-hover:text-white", "group-hover:text-cyan-400",
    // Animations
    "animate-pulse", "animate-ping",
    "animate-fade-in", "animate-slide-up", "animate-pulse-glow",
    // Misc
    "cursor-pointer",
    "selection:bg-cyan-500/20",
    "transform", "-rotate-90",
    "inline-flex", "rounded-full",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#020617",
          900: "#0f172a",
          850: "#182235", // Custom intermediate dark
          800: "#1e293b",
          700: "#334155"
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          50: "#ecfeff"
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  darkMode: "class"
};
