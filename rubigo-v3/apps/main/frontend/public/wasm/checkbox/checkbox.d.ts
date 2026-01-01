/* tslint:disable */
/* eslint-disable */

export class Checkbox {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Set to checked state
   */
  set_checked(): boolean;
  /**
   * Set to unchecked state
   */
  set_unchecked(): boolean;
  /**
   * Set to indeterminate visual state
   */
  set_indeterminate(): boolean;
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
  readonly __wbg_checkbox_free: (a: number, b: number) => void;
  readonly checkbox_context_json: (a: number) => [number, number];
  readonly checkbox_new: () => number;
  readonly checkbox_set_checked: (a: number) => number;
  readonly checkbox_set_indeterminate: (a: number) => number;
  readonly checkbox_set_unchecked: (a: number) => number;
  readonly checkbox_state_name: (a: number) => [number, number];
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
