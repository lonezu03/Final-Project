// src/redux/rootReducer.js
import { combineReducers } from 'redux';

import novelReducer from './novelSlice';
import authorReducer from './authorSlice';
import categoryReducer from './categorySlice';
import chapterReducer from './chapterSlice';
import userReducer from './userSlice';
import statisticReducer from './statisticSlice';
import transactionReducer from './transactionSlice';
import commentsReducer from './commentSlice';
import rolePermissionReducer from './rolePermissionSlice';


const rootReducer = combineReducers({
  novels: novelReducer,
  authors: authorReducer,
  categories: categoryReducer,
  chapters: chapterReducer,
  user: userReducer,
  statistics: statisticReducer,
  transaction: transactionReducer,
  comments: commentsReducer,
  rolePermission: rolePermissionReducer,
});

export default rootReducer;
