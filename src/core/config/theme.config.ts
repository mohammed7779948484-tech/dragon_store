/**
 * Theme config (Single Source of Truth)
 * 
 * Defines the core design system tokens including colors, typography,
 * and radii. This configuration enforces the Deep Obsidian and Electric Lime
 * brand palette across the application as per design audit and guidelines.
 * 
 * Note: These values map to the CSS variables in src/app/globals.css
 */

export const themeConfig = {
    colors: {
        // Core Palette
        background: '#0F1111',  // Deep Obsidian (Dark Theme Default)
        foreground: '#E8ECEF',  // Cloud White

        // Surfaces
        surface: '#181B1F',     // Cards / Popovers
        surfaceForeground: '#E8ECEF',

        // Brand & Accents (Now matched to globals.css)
        primary: '#3b82f6',     // Electric Blue (Approximate hex for TS usage)
        primaryForeground: '#0F1111',
        secondary: '#1A202C',
        secondaryForeground: '#E8ECEF',

        brandPrimary: '#ff3366',
        brandPurple: '#b347ff',
        brandGold: '#fbc91c',
        brandPromo: '#ff3344',

        // States & Interactions
        muted: '#1E2429',
        mutedForeground: '#A0AEC0',
        accent: '#262F3D',      // Slate Accent
        accentForeground: '#E8ECEF',
        destructive: '#ff3344',
        destructiveForeground: '#E8ECEF',
        success: '#22c55e',
        successForeground: '#E8ECEF',

        // UI Elements
        border: '#2D3748',
        input: '#2D3748',
    },
    radii: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
    },
} as const;

export type ThemeConfig = typeof themeConfig;
