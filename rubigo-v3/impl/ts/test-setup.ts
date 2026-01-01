/**
 * Test setup for Bun + SolidJS component testing
 * 
 * Preloads happy-dom for DOM simulation before tests run.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
