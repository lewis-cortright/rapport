import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthState = {
  token: string | null;
};

export type AuthRootState = {
  auth: AuthState;
};

const initialState: AuthState = {
  token: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    clearCredentials(state) {
      state.token = null;
    }
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;

export function selectToken(state: AuthRootState) {
  return state.auth.token;
}

export function selectIsAuthenticated(state: AuthRootState) {
  return Boolean(state.auth.token);
}

