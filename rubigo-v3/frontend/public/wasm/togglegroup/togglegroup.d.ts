/* tslint:disable */
/* eslint-disable */

export class ToggleGroup {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Reset focus to selected item on blur
   */
  reset_focus(): boolean;
  /**
   * Select an item by ID
   */
  select_item(): boolean;
  /**
   * Select the currently focused item
   */
  activate_item(): boolean;
  /**
   * Focus the last item
   */
  focus_last_item(): boolean;
  /**
   * Focus the next item (wraps)
   */
  focus_next_item(): boolean;
  /**
   * Focus the previous item (wraps)
   */
  focus_prev_item(): boolean;
  /**
   * Focus the first item
   */
  focus_first_item(): boolean;
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
  readonly __wbg_togglegroup_free: (a: number, b: number) => void;
  readonly togglegroup_activate_item: (a: number) => number;
  readonly togglegroup_context_json: (a: number) => [number, number];
  readonly togglegroup_focus_first_item: (a: number) => number;
  readonly togglegroup_focus_last_item: (a: number) => number;
  readonly togglegroup_focus_next_item: (a: number) => number;
  readonly togglegroup_focus_prev_item: (a: number) => number;
  readonly togglegroup_new: () => number;
  readonly togglegroup_reset_focus: (a: number) => number;
  readonly togglegroup_select_item: (a: number) => number;
  readonly togglegroup_state_name: (a: number) => [number, number];
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
