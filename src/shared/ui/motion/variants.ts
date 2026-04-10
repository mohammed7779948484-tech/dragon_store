/**
 * Centralized Framer Motion Variants Library
 * 
 * Defines standard animation states to enforce a uniform, luxurious
 * feel across the application while respecting accessibility constraints.
 * 
 * @see ui-ux-pro-max: "Use 150-300ms for micro-interactions"
 * @see ui-ux-pro-max: "Check prefers-reduced-motion" (handled via variants)
 */

export const easeLux = [0.25, 1, 0.5, 1]; // Smooth, frictionless deceleration

export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
};

export const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: easeLux,
        },
    },
};

export const scaleTap = {
    hover: { scale: 1.02, transition: { duration: 0.2, ease: easeLux } },
    tap: { scale: 0.95, transition: { duration: 0.1, ease: easeLux } },
};

export const glowHover = {
    rest: {
        scale: 1,
        boxShadow: "0px 0px 0px 0px hsl(var(--primary) / 0)",
        borderColor: "hsl(var(--border))",
    },
    hover: {
        scale: 1.01,
        boxShadow: "0px 4px 20px -2px hsl(var(--primary) / 0.15)",
        borderColor: "hsl(var(--primary) / 0.5)",
        transition: {
            duration: 0.3,
            ease: easeLux,
        },
    },
};

export const slideInRight = {
    hidden: { x: "100%", opacity: 0 },
    show: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
    exit: {
        x: "100%",
        opacity: 0,
        transition: {
            duration: 0.2,
            ease: easeLux,
        },
    }
};
