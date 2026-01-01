/* tslint:disable */
/* eslint-disable */

export class Button {
  free(): void;
  [Symbol.dispose](): void;
  set_focused(): boolean;
  clear_focused(): boolean;
  /**
   * Reset all context to initial values
   */
  reset_context(): boolean;
  /**
   * Emit click/activation event
   */
  trigger_action(): boolean;
  /**
   * Start loading state
   */
  set_loading_true(): boolean;
  /**
   * Set pressed state to true
   */
  set_pressed_true(): boolean;
  /**
   * End loading state
   */
  set_loading_false(): boolean;
  /**
   * Set pressed state to false
   */
  set_pressed_false(): boolean;
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
  readonly __wbg_button_free: (a: number, b: number) => void;
  readonly button_clear_focused: (a: number) => number;
  readonly button_context_json: (a: number) => [number, number];
  readonly button_new: () => number;
  readonly button_reset_context: (a: number) => number;
  readonly button_set_focused: (a: number) => number;
  readonly button_set_loading_false: (a: number) => number;
  readonly button_set_loading_true: (a: number) => number;
  readonly button_set_pressed_false: (a: number) => number;
  readonly button_set_pressed_true: (a: number) => number;
  readonly button_state_name: (a: number) => [number, number];
  readonly button_trigger_action: (a: number) => number;
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
