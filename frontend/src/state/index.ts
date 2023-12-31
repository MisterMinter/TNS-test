import { combineReducers, configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import user from './user/reducer'
import tlds from './tlds/reducer'

const PERSISTED_KEYS: string[] = ['tlds']

const persistConfig = {
  key: 'primary',
  whitelist: PERSISTED_KEYS,
  storage,
}

const persistedReducer = persistReducer(
  persistConfig,
  combineReducers({
    user,
    tlds,
  }),
)

let store: ReturnType<typeof makeStore>

function makeStore(preloadedState = undefined) {
  return configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware({
      thunk: true,
      serializableCheck: false,
    }),
    devTools: process.env.NODE_ENV === 'development',
    preloadedState,
  })
}

export const initializeStore = (preloadedState = undefined) => {
  let _store = store ?? makeStore(preloadedState)

  // After navigating to a page with an initial Redux state, merge that state
  // with the current state in the store, and create a new store
  if (preloadedState && store) {
    _store = makeStore({
      ...store.getState(),
      ...preloadedState,
    })
    // Reset the current store
    store = undefined
  }

  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store

  // Create the store once in the client
  if (!store) {
    store = _store
  }

  return _store
}

store = initializeStore()

/**
 * @see https://redux-toolkit.js.org/usage/usage-with-typescript#getting-the-dispatch-type
 */
export type AppDispatch = typeof store.dispatch
export type AppState = ReturnType<typeof store.getState>
export const useAppDispatch = () => useDispatch()

export default store

export const persistor = persistStore(store)

export function useStore(initialState) {
  return useMemo(() => initializeStore(initialState), [initialState])
}
