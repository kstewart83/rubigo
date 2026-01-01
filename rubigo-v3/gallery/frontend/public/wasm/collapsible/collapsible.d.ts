/* tslint:disable */
/* eslint-disable */

export class Collapsible {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  /**
   * Expand the content panel
   */
  expand(): boolean;
  /**
   * Collapse the content panel
   */
  collapse(): boolean;
  readonly state_name: string;
  /**
   * Get context as JSON string (for JS interop)
   */
  readonly context_json: string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_collapsible_free: (a: number, b: number) => void;
  readonly collapsible_collapse: (a: number) => number;
  readonly collapsible_context_json: (a: number) => [number, number];
  readonly collapsible_expand: (a: number) => number;
  readonly collapsible_new: () => number;
  readonly collapsible_state_name: (a: number) => [number, number];
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
