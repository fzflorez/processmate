/**
 * useToggle Hook
 * Provides toggle functionality for boolean states with additional utilities
 */

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * useToggle hook options
 */
export interface UseToggleOptions {
  /**
   * Initial state value
   */
  initial?: boolean;

  /**
   * Callback function called when toggle changes
   */
  onChange?: (value: boolean) => void;

  /**
   * Reset to initial value after specified delay (ms)
   */
  autoReset?: number;
}

/**
 * useToggle hook return value
 */
export interface UseToggleReturn {
  /**
   * Current boolean value
   */
  value: boolean;

  /**
   * Toggle the current value
   */
  toggle: () => void;

  /**
   * Set to true
   */
  setTrue: () => void;

  /**
   * Set to false
   */
  setFalse: () => void;

  /**
   * Set to specific value
   */
  setValue: (value: boolean) => void;

  /**
   * Reset to initial value
   */
  reset: () => void;

  /**
   * Initial value
   */
  initialValue: boolean;
}

/**
 * useToggle hook for managing boolean states
 *
 * @param options - Configuration options
 * @returns Hook return value with state and controls
 *
 * @example
 * ```tsx
 * const { value: isOpen, toggle, setTrue, setFalse } = useToggle({
 *   initial: false,
 *   onChange: (isOpen) => console.log('Modal is now:', isOpen)
 * });
 *
 * return (
 *   <>
 *     <button onClick={toggle}>Toggle Modal</button>
 *     <button onClick={setTrue}>Open Modal</button>
 *     <button onClick={setFalse}>Close Modal</button>
 *     {isOpen && <Modal />}
 *   </>
 * );
 * ```
 */
export function useToggle(options: UseToggleOptions = {}): UseToggleReturn {
  const { initial = false, onChange, autoReset } = options;

  const [value, setValue] = useState<boolean>(initial);
  const [initialValue] = useState(initial);
  const autoResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear auto-reset timeout when value changes
  useEffect(() => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
    }
  }, [value]);

  const handleChange = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      onChange?.(newValue);

      // Set up auto-reset if specified
      if (autoReset && newValue !== initialValue) {
        autoResetTimeoutRef.current = setTimeout(() => {
          setValue(initialValue);
          onChange?.(initialValue);
        }, autoReset);
      }
    },
    [onChange, autoReset, initialValue],
  );

  const toggle = useCallback(() => {
    handleChange(!value);
  }, [value, handleChange]);

  const setTrue = useCallback(() => {
    handleChange(true);
  }, [handleChange]);

  const setFalse = useCallback(() => {
    handleChange(false);
  }, [handleChange]);

  const setValueDirect = useCallback(
    (newValue: boolean) => {
      handleChange(newValue);
    },
    [handleChange],
  );

  const reset = useCallback(() => {
    handleChange(initialValue);
  }, [handleChange, initialValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoResetTimeoutRef.current) {
        clearTimeout(autoResetTimeoutRef.current);
      }
    };
  }, []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue: setValueDirect,
    reset,
    initialValue,
  };
}

/**
 * useToggleGroup hook for managing multiple related toggles
 *
 * @param toggles - Object with initial toggle values
 * @param options - Configuration options
 * @returns Object with toggle states and controls
 *
 * @example
 * ```tsx
 * const {
 *   values: { showHeader, showSidebar, showFooter },
 *   toggles: { toggleHeader, toggleSidebar, toggleFooter },
 *   setters: { setShowHeader, setShowSidebar, setShowFooter }
 * } = useToggleGroup({
 *   showHeader: true,
 *   showSidebar: false,
 *   showFooter: true
 * });
 * ```
 */
export function useToggleGroup<T extends Record<string, boolean>>(
  initialToggles: T,
  options: UseToggleOptions = {},
) {
  const [values, setValues] = useState<T>(initialToggles);
  const { onChange } = options;

  const toggle = useCallback(
    (key: keyof T) => {
      setValues((prev) => {
        const newValues = { ...prev, [key]: !prev[key] };
        onChange?.(newValues[key] as boolean);
        return newValues;
      });
    },
    [onChange],
  );

  const setValue = useCallback(
    (key: keyof T, value: boolean) => {
      setValues((prev) => {
        const newValues = { ...prev, [key]: value };
        onChange?.(value);
        return newValues;
      });
    },
    [onChange],
  );

  const setTrue = useCallback(
    (key: keyof T) => {
      setValue(key, true);
    },
    [setValue],
  );

  const setFalse = useCallback(
    (key: keyof T) => {
      setValue(key, false);
    },
    [setValue],
  );

  const reset = useCallback(() => {
    setValues(initialToggles);
  }, [setValues, initialToggles]);

  const resetKey = useCallback(
    (key: keyof T) => {
      setValue(key, initialToggles[key]);
    },
    [setValue, initialToggles],
  );

  // Create convenience objects
  const toggles = {} as Record<keyof T, () => void>;
  const setters = {} as Record<keyof T, (value: boolean) => void>;
  const settersTrue = {} as Record<keyof T, () => void>;
  const settersFalse = {} as Record<keyof T, () => void>;

  for (const key of Object.keys(initialToggles) as Array<keyof T>) {
    toggles[key] = () => toggle(key);
    setters[key] = (value: boolean) => setValue(key, value);
    settersTrue[key] = () => setTrue(key);
    settersFalse[key] = () => setFalse(key);
  }

  return {
    values,
    toggles,
    setters,
    settersTrue,
    settersFalse,
    toggle,
    setValue,
    setTrue,
    setFalse,
    reset,
    resetKey,
  };
}

/**
 * useToggleSequence hook for cycling through a sequence of values
 *
 * @param sequence - Array of values to cycle through
 * @param options - Configuration options
 * @returns Hook return value with current value and controls
 *
 * @example
 * ```tsx
 * const { value: step, next, previous, reset, goTo } = useToggleSequence(
 *   ['step1', 'step2', 'step3'],
 *   { initial: 0 }
 * );
 *
 * return (
 *   <div>
 *     <p>Current step: {step}</p>
 *     <button onClick={next}>Next</button>
 *     <button onClick={previous}>Previous</button>
 *     <button onClick={reset}>Reset</button>
 *   </div>
 * );
 * ```
 */
export function useToggleSequence<T>(
  sequence: T[],
  options: {
    initial?: number;
    loop?: boolean;
    onChange?: (value: T, index: number) => void;
  } = {},
) {
  const { initial = 0, loop = true, onChange } = options;

  const [currentIndex, setCurrentIndex] = useState<number>(initial);
  const currentValue = sequence[currentIndex];

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < sequence.length) {
        setCurrentIndex(index);
        onChange?.(sequence[index], index);
      }
    },
    [sequence, onChange],
  );

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sequence.length) {
      if (loop) {
        goTo(0);
      }
    } else {
      goTo(nextIndex);
    }
  }, [currentIndex, sequence.length, loop, goTo]);

  const previous = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (loop) {
        goTo(sequence.length - 1);
      }
    } else {
      goTo(prevIndex);
    }
  }, [currentIndex, sequence.length, loop, goTo]);

  const reset = useCallback(() => {
    goTo(initial);
  }, [goTo, initial]);

  return {
    value: currentValue,
    index: currentIndex,
    next,
    previous,
    reset,
    goTo,
    hasNext: loop || currentIndex < sequence.length - 1,
    hasPrevious: loop || currentIndex > 0,
  };
}
