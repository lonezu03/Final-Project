// src/redux/rolePermissionSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../services/api';

// API Thunks
export const getAllRoles = createAsyncThunk(
  'rolePermission/getAllRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/rolePermission/getAllRole');
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách roles.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải danh sách roles.');
    }
  }
);

export const getAllPermissions = createAsyncThunk(
  'rolePermission/getAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/rolePermission/getAllPermission');
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể tải danh sách permissions.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi tải danh sách permissions.');
    }
  }
);

export const addPermissionToRole = createAsyncThunk(
  'rolePermission/addPermissionToRole',
  async ({ idRole, idPermission }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/rolePermission/addPermissionToRole', {
        idRole,
        idPermission
      });
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể thêm quyền cho role.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi thêm quyền cho role.');
    }
  }
);

export const removePermissionFromRole = createAsyncThunk(
  'rolePermission/removePermissionFromRole',
  async ({ idRole, idPermission }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/rolePermission/removePermissionToRole', {
        idRole,
        idPermission
      });
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể xóa quyền khỏi role.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi xóa quyền khỏi role.');
    }
  }
);

export const whiteListPermission = createAsyncThunk(
  'rolePermission/whiteListPermission',
  async (idPermission, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/rolePermission/whiteListPermission/${idPermission}`);
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể whitelist permission.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi whitelist permission.');
    }
  }
);

export const unWhiteListPermission = createAsyncThunk(
  'rolePermission/unWhiteListPermission',
  async (idPermission, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/rolePermission/unWhiteListPermission/${idPermission}`);
      if (response.data && response.data.code === 1000) {
        return response.data.result;
      }
      return rejectWithValue(response.data?.message || 'Không thể un-whitelist permission.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Lỗi khi un-whitelist permission.');
    }
  }
);

const initialState = {
  roles: [],
  permissions: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
  actionSuccess: null,
};

const rolePermissionSlice = createSlice({
  name: 'rolePermission',
  initialState,
  reducers: {
    clearActionMessages: (state) => {
      state.actionError = null;
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get All Roles
      .addCase(getAllRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get All Permissions
      .addCase(getAllPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(getAllPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Permission to Role
      .addCase(addPermissionToRole.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(addPermissionToRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Thêm quyền cho role thành công!';
        // Update roles array
        const updatedRole = action.payload;
        const roleIndex = state.roles.findIndex(role => role.idRoleUser === updatedRole.idRoleUser);
        if (roleIndex !== -1) {
          state.roles[roleIndex] = updatedRole;
        }
      })
      .addCase(addPermissionToRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Remove Permission from Role
      .addCase(removePermissionFromRole.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(removePermissionFromRole.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Xóa quyền khỏi role thành công!';
        // Update roles array
        const updatedRole = action.payload;
        const roleIndex = state.roles.findIndex(role => role.idRoleUser === updatedRole.idRoleUser);
        if (roleIndex !== -1) {
          state.roles[roleIndex] = updatedRole;
        }
      })
      .addCase(removePermissionFromRole.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Whitelist Permission
      .addCase(whiteListPermission.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(whiteListPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Whitelist permission thành công!';
        // Update permissions array
        const updatedPermission = action.payload;
        const permissionIndex = state.permissions.findIndex(p => p.idPermission === updatedPermission.idPermission);
        if (permissionIndex !== -1) {
          state.permissions[permissionIndex] = updatedPermission;
        }
      })
      .addCase(whiteListPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Un-Whitelist Permission
      .addCase(unWhiteListPermission.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(unWhiteListPermission.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = 'Un-whitelist permission thành công!';
        // Update permissions array
        const updatedPermission = action.payload;
        const permissionIndex = state.permissions.findIndex(p => p.idPermission === updatedPermission.idPermission);
        if (permissionIndex !== -1) {
          state.permissions[permissionIndex] = updatedPermission;
        }
      })
      .addCase(unWhiteListPermission.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  }
});

export const { clearActionMessages } = rolePermissionSlice.actions;
export default rolePermissionSlice.reducer;
