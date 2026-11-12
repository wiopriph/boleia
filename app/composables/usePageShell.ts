import type { InjectionKey } from 'vue';


// Set by UiSectionShell: the page inside already sits in the shared container, so UiPage adds none.
export const PAGE_SHELL_KEY: InjectionKey<boolean> = Symbol('page-shell');
