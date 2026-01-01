/* tslint:disable */
/* eslint-disable */

export class Select {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Close the dropdown
   */
  close_menu(): boolean;
  /**
   * Select the highlighted option and close
   */
  select_option(): boolean;
  /**
   * Highlight the last option
   */
  highlight_last(): boolean;
  /**
   * Highlight the next option in the list
   */
  highlight_next(): boolean;
  /**
   * Highlight the previous option in the list
   */
  highlight_prev(): boolean;
  /**
   * Highlight the first option
   */
  highlight_first(): boolean;
  constructor();
  /**
   * Open the dropdown and sync highlight to selected
   */
  open_menu(): boolean;
  readonly state_name: string;
  /**
   * Get context as JSON string (for JS interop)
   */
  readonly context_json: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_select_free: (a: number, b: number) => void;
  readonly select_close_menu: (a: number) => number;
  readonly select_context_json: (a: number) => [number, number];
  readonly select_highlight_first: (a: number) => number;
  readonly select_highlight_last: (a: number) => number;
  readonly select_highlight_next: (a: number) => number;
  readonly select_highlight_prev: (a: number) => number;
  readonly select_new: () => number;
  readonly select_open_menu: (a: number) => number;
  readonly select_select_option: (a: number) => number;
  readonly select_state_name: (a: number) => [number, number];
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
