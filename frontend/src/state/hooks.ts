import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/**
 * Typed dispatch hook for Redux actions and thunks.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Typed selector hook bound to the application's root state.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

