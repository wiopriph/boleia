export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'brand',
      neutral: 'stone',
      success: 'green',
      warning: 'amber',
      error: 'red',
      info: 'blue',
    },
    button: {
      slots: {
        base: 'cursor-pointer rounded-control justify-center font-semibold',
      },
      variants: {
        size: {
          xs: { base: 'min-h-8' },
          sm: { base: 'min-h-10 px-3' },
          md: { base: 'min-h-11 px-4' },
          lg: { base: 'min-h-12 px-5' },
          xl: { base: 'min-h-13 px-5' },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'hover:bg-secondary active:bg-secondary',
        },
        // icon-only buttons are as wide as they are high, so they line up with the controls
        { square: true, size: 'xs', class: 'min-w-8' },
        { square: true, size: 'sm', class: 'min-w-10' },
        { square: true, size: 'md', class: 'min-w-11' },
        { square: true, size: 'lg', class: 'min-w-12' },
        { square: true, size: 'xl', class: 'min-w-13' },
      ],
    },
    input: {
      slots: { base: 'rounded-control' },
      variants: {
        size: {
          md: { base: 'min-h-12' },
          lg: { base: 'min-h-12' },
          xl: { base: 'min-h-13' },
        },
      },
    },
    inputMenu: {
      slots: { base: 'rounded-control', content: 'rounded-control' },
      variants: {
        size: {
          md: { base: 'min-h-12' },
          lg: { base: 'min-h-12' },
          xl: { base: 'min-h-13' },
        },
      },
    },
    select: {
      slots: { base: 'rounded-control', content: 'rounded-control' },
      variants: {
        size: {
          md: { base: 'min-h-12' },
          lg: { base: 'min-h-12' },
          xl: { base: 'min-h-13' },
        },
      },
    },
    selectMenu: {
      slots: { base: 'rounded-control', content: 'rounded-control' },
      variants: {
        size: {
          md: { base: 'min-h-12' },
          lg: { base: 'min-h-12' },
          xl: { base: 'min-h-13' },
        },
      },
    },
    // one row of a textarea is as high as an input of the same size (48px, 52px for xl)
    textarea: {
      slots: { base: 'rounded-control' },
      variants: {
        size: {
          md: { base: 'py-3.5' },
          lg: { base: 'py-3.5' },
          xl: { base: 'py-3.5' },
        },
      },
    },
    card: {
      slots: {
        root: 'rounded-card shadow-none ring-default',
        header: 'px-5 py-4 sm:px-6',
        body: 'p-5 sm:p-6',
        footer: 'px-5 py-4 sm:px-6',
      },
    },
    modal: { slots: { content: 'rounded-card shadow-lg', overlay: 'bg-stone-950/40', title: 'text-lg font-semibold' } },
    alert: { slots: { root: 'rounded-control' } },
    badge: { slots: { base: 'rounded-md font-medium' } },
    skeleton: { base: 'rounded-card' },
    formField: { slots: { label: 'text-sm font-medium', container: 'mt-2' } },
    tabs: { slots: { list: 'rounded-control bg-elevated p-1', trigger: 'min-h-11 rounded-chip', indicator: 'rounded-chip shadow-none' } },
    prose: {
      h2: { slots: { base: 'text-xl font-semibold mt-8 mb-3' } },
      h3: { slots: { base: 'text-base font-semibold mt-6 mb-2' } },
      p: { base: 'leading-relaxed' },
    },
  },
});
