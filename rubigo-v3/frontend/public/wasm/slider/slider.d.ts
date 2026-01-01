/* tslint:disable */
/* eslint-disable */

export class Slider {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Set value to maximum
   */
  set_to_max(): boolean;
  /**
   * Set value to minimum
   */
  set_to_min(): boolean;
  /**
   * Begin drag interaction
   */
  start_drag(): boolean;
  /**
   * Update value during drag
   */
  update_value(): boolean;
  /**
   * Decrease value by step, clamped to min
   */
  decrement_value(): boolean;
  /**
   * Increase value by step, clamped to max
   */
  increment_value(): boolean;
  constructor();
  /**
   * End drag interaction
   */
  end_drag(): boolean;
  readonly state_name: string;
  /**
   * Get context as JSON string (for JS interop)
   */
  readonly context_json: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_slider_free: (a: number, b: number) => void;
  readonly slider_context_json: (a: number) => [number, number];
  readonly slider_decrement_value: (a: number) => number;
  readonly slider_end_drag: (a: number) => number;
  readonly slider_increment_value: (a: number) => number;
  readonly slider_new: () => number;
  readonly slider_set_to_max: (a: number) => number;
  readonly slider_set_to_min: (a: number) => number;
  readonly slider_start_drag: (a: number) => number;
  readonly slider_state_name: (a: number) => [number, number];
  readonly slider_update_value: (a: number) => number;
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
