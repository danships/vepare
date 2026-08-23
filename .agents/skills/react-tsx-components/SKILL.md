---
name: react-tsx-components
description: Use when editing or creating React TSX component files in this project.
---

# React TSX components

- Compose Mantine 9 components and system props for standard layout, spacing, typography, and controls before adding custom CSS.
- Keep component-specific CSS in a colocated `.module.css` file only when Mantine cannot express the visual requirement; do not use inline `<style>` tags.
- Use typed props, preferring `type` aliases to interfaces.
- Do not use console methods for user-facing feedback. Add an intentional, accessible UI feedback pattern when a future interactive component needs one.
