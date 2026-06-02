# Style Guide

This document outlines the new design system for the application, including the color palette, typography, and component styles.

## Color Palette

The new color palette is designed to be modern, accessible, and visually balanced. It reserves the vibrant orange for primary actions while using a muted blue for secondary elements and neutral grays for backgrounds and borders.

| Color | Usage | HSL | Hex |
| --- | --- | --- | --- |
| Brand | Primary actions, logos, and key brand elements | `38 85% 52%` | `#f2a619` |
| Primary | Secondary buttons, active states, and links | `216 42% 28%` | `#2a4a6e` |
| Secondary | Tertiary buttons and less important actions | `216 22% 22%` | `#2c3a47` |
| Fresh | Success states and positive affirmations | `158 45% 40%` | `#3fad8e` |
| Warning | Warning messages and alerts | `38 88% 52%` | `#f7b731` |
| Destructive | Destructive actions and error states | `0 68% 50%` | `#e74c3c` |
| Gold | VIP status and special offers | `43 70% 50%` | `#e6b422` |

## Accessibility

All colors in the new palette have been chosen to meet WCAG 2.1 contrast ratio standards against both light and dark backgrounds, ensuring readability for all users.

- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio

## Component Styles

### Buttons

- **Primary Button**: Uses the `brand` color for the background and `brand-foreground` for the text.
- **Secondary Button**: Uses the `primary` color for the background and `primary-foreground` for the text.
- **Tertiary Button**: Uses the `secondary` color for the background and `secondary-foreground` for the text.

### Cards

- **`glass-card`**: Uses `border-border/50` for the border, `bg-card/60` for the background, and `backdrop-blur-lg` for the backdrop blur.

### Status Badges

- **Confirmed**: Uses `bg-primary/12` for the background and `text-primary` for the text.
- **Pending**: Uses `bg-warning/12` for the background and `text-warning` for the text.
- **Cancelled**: Uses `bg-destructive/12` for the background and `text-destructive` for the text.
- **No-show**: Uses `bg-muted` for the background and `text-muted-foreground` for the text.
- **Completed**: Uses `bg-fresh/12` for the background and `text-fresh` for the text.
