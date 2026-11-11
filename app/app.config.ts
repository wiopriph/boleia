export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'slate',
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
    },
    // markdown pages: headings one step below the page h1
    prose: {
      h2: { slots: { base: 'text-xl font-semibold mt-8 mb-3' } },
      h3: { slots: { base: 'text-base font-semibold mt-6 mb-2' } },
    },
  },
});
