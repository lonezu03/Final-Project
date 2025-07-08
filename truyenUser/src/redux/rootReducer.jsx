import { combineReducers } from '@reduxjs/toolkit';
import novelReducer from './novelSlice';
import authorReducer from './authorSlice';
import categoryReducer from './categorySlice';
import chapterReducer from './chapterSlice';
import userReducer from './userSlice'; 
import commentsReducer from './commentSlice';
import paymentReducer from './paymentSlice'; 
import transactionReducer from './transactionSlice'; 



const rootReducer = combineReducers({
  novels: novelReducer,
  authors: authorReducer,
  categories: categoryReducer,
  chapters: chapterReducer,
  user: userReducer, 
  comments: commentsReducer,
  payment: paymentReducer,
  transaction: transactionReducer, 


});

export default rootReducer;