# Form Color Customization

This document outlines how to adjust the colors for the forms used in this application, which are built with SurveyJS.

## Global Brand Colors

The primary brand colors are defined as CSS custom properties (variables) in `src/index.css`. These colors are used throughout the application, including the forms.

To change the main brand color used for buttons and highlights, modify the `--color-brand-*` variables within the `@theme` block in `src/index.css`:

```css
/* src/index.css */

@theme {
  /* ... other variables ... */
  --color-brand-600: oklch(0.35 0.12 240); /* Used for primary buttons */
  --color-brand-700: oklch(0.25 0.14 240); /* Used for button hover states */
  /* ... other variables ... */
}
```

## Form-Specific Styles

For more detailed control over the form elements, you can edit `src/forms/survey-theme.css`. This file contains all the style overrides for the SurveyJS components.

### Key Sections in `survey-theme.css`:

*   **Buttons**: Search for `.sv-btn` to find the styles for the main action buttons (like "Next" and "Complete"). We've set them to use the global brand colors:

    ```css
    .sv-btn, .sv-action__content {
      background: var(--color-brand-600) !important;
      color: white !important;
    }

    .sv-btn:hover, .sv-action__content:hover {
      background: var(--color-brand-700) !important;
    }
    ```

*   **Form Background**: The overall background of the survey area is controlled by rules targeting `.sv-root`, `.sv-body`, and other high-level selectors. These have been set to `transparent` to allow the parent page background to show through.

*   **Input Fields**: Styles for text boxes, dropdowns, etc., can be found by searching for `.sv-text`, `.sv-comment`, and `.sv-dropdown`.

By adjusting the variables in `src/index.css` and the specific overrides in `src/forms/survey-theme.css`, you can customize the look and feel of the forms to match your design requirements.
