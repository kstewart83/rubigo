/* tslint:disable */
/* eslint-disable */

export class WasmMachine {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get the context as a JS object (uses direct JS object construction)
   */
  getContext(): any;
  /**
   * Get the current state (for flat machines)
   */
  currentState(): string;
  /**
   * Get the context as a JSON string (JS should JSON.parse this)
   */
  getContextJson(): string;
  /**
   * Set a boolean value in the context
   */
  setContextBool(key: string, value: boolean): void;
  /**
   * Send an event with payload to the machine and return the result as JSON
   */
  sendWithPayload(event_name: string, payload_js: any): any;
  /**
   * Set a number value in the context
   */
  setContextNumber(key: string, value: number): void;
  /**
   * Set a string value in the context
   */
  setContextString(key: string, value: string): void;
  /**
   * Send an event to the machine and return the result as JSON
   */
  send(event_name: string): any;
  /**
   * Create a new WasmMachine from a JSON configuration string
   */
  constructor(json_config: string);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmmachine_free: (a: number, b: number) => void;
  readonly wasmmachine_currentState: (a: number) => [number, number];
  readonly wasmmachine_from_json: (a: number, b: number) => [number, number, number];
  readonly wasmmachine_getContext: (a: number) => [number, number, number];
  readonly wasmmachine_getContextJson: (a: number) => [number, number, number, number];
  readonly wasmmachine_send: (a: number, b: number, c: number) => [number, number, number];
  readonly wasmmachine_sendWithPayload: (a: number, b: number, c: number, d: any) => [number, number, number];
  readonly wasmmachine_setContextBool: (a: number, b: number, c: number, d: number) => void;
  readonly wasmmachine_setContextNumber: (a: number, b: number, c: number, d: number) => void;
  readonly wasmmachine_setContextString: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
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
