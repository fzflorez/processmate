/**
 * Global Hooks Index
 * Central export point for all custom hooks
 */

// Async hooks
export { useAsync, useAsyncSimple, useAsyncMulti } from './useAsync';
export type { UseAsyncOptions, UseAsyncReturn } from './useAsync';

// Debounce hooks
export { 
  useDebounce, 
  useDebounceCallback, 
  useDebouncedState, 
  useThrottleCallback 
} from './useDebounce';
export type { UseDebounceOptions } from './useDebounce';

// Toggle hooks
export { 
  useToggle, 
  useToggleGroup, 
  useToggleSequence 
} from './useToggle';
export type { UseToggleOptions, UseToggleReturn } from './useToggle';

// Future hooks exports can be added here
// export { useLocalStorage } from './useLocalStorage';
// export { useMediaQuery } from './useMediaQuery';
// export { useKeyPress } from './useKeyPress';
// export { useOnClickOutside } from './useOnClickOutside';
// export { useScrollPosition } from './useScrollPosition';
// export { useWindowSize } from './useWindowSize';
