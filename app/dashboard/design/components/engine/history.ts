export type HistoryState<T> = { past: T[]; present: T; future: T[] };
export function createHistory<T>(initial: T): HistoryState<T> { return { past: [], present: initial, future: [] }; }
export function pushHistory<T>(state: HistoryState<T>, next: T, limit = 60): HistoryState<T> { return { past: [...state.past, state.present].slice(-limit), present: next, future: [] }; }
export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> { if (!state.past.length) return state; const present = state.past[state.past.length - 1]; return { past: state.past.slice(0, -1), present, future: [state.present, ...state.future] }; }
export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> { if (!state.future.length) return state; const present = state.future[0]; return { past: [...state.past, state.present], present, future: state.future.slice(1) }; }
