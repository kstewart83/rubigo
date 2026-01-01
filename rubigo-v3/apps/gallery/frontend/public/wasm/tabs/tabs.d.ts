/* tslint:disable */
/* eslint-disable */

export class Tabs {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Set the selected tab from event payload
   */
  set_selected(): boolean;
  /**
   * Focus the last tab
   */
  focus_last_tab(): boolean;
  /**
   * Move focus to next tab (wraps)
   */
  focus_next_tab(): boolean;
  /**
   * Move focus to previous tab (wraps)
   */
  focus_prev_tab(): boolean;
  /**
   * Focus the first tab
   */
  focus_first_tab(): boolean;
  /**
   * Activate the currently focused tab
   */
  activate_focused(): boolean;
  constructor();
  readonly state_name: string;
  /**
   * Get context as JSON string (for JS interop)
   */
  readonly context_json: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_tabs_free: (a: number, b: number) => void;
  readonly tabs_activate_focused: (a: number) => number;
  readonly tabs_context_json: (a: number) => [number, number];
  readonly tabs_focus_first_tab: (a: number) => number;
  readonly tabs_focus_last_tab: (a: number) => number;
  readonly tabs_focus_next_tab: (a: number) => number;
  readonly tabs_focus_prev_tab: (a: number) => number;
  readonly tabs_new: () => number;
  readonly tabs_set_selected: (a: number) => number;
  readonly tabs_state_name: (a: number) => [number, number];
  readonly main: (a: number, b: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
