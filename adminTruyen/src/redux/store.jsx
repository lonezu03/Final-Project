// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

const store = configureStore({
  reducer: rootReducer,
  // Redux DevTools được kích hoạt tự động trong development mode với Redux Toolkit
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
