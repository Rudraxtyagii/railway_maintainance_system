import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { realtimeService } from '../services/realtimeService';

const AuthContext = createContext(null);

// Route access rules per RBAC role - strict departmental isolation (no dashboard, only block-requests, copilot, notifications, profile)
const ROLE_ROUTE_PERMISSIONS = {
  PLANNER_ADMIN: ['*'], // Full access to all routes for Central Planning Admin
  DEPT_ENGINEER: [
    '/block-requests',
    '/ai-copilot',
    '/rail-gpt',
    '/notifications',
    '/profile'
  ],
  SNT_OFFICER: [
    '/block-requests',
    '/ai-copilot',
    '/rail-gpt',
    '/notifications',
    '/profile'
  ],
  TRD_ENGINEER: [
    '/block-requests',
    '/ai-copilot',
    '/rail-gpt',
    '/notifications',
    '/profile'
  ],
  FIELD_CONTROLLER: [
    '/block-requests',
    '/ai-copilot',
    '/rail-gpt',
    '/notifications',
    '/profile'
  ]
};

// Feature-level permissions per RBAC role
const ROLE_FEATURE_PERMISSIONS = {
  PLANNER_ADMIN: {
    SUBMIT_ANY_REQUEST: true,
    SUBMIT_OWN_DEPT: true,
    APPROVE_BLOCK: true,
    RUN_SOLVER: true,
    APPLY_RECOMMENDATION: true,
    SIGN_PTW: true,
    OVERRIDE_PRIORITY: true,
    GENERATE_TELEGRAPH: true,
    MANAGE_USERS: true,
    DATA_SYNC: true,
  },
  DEPT_ENGINEER: {
    SUBMIT_ANY_REQUEST: false,
    SUBMIT_OWN_DEPT: true,
    ALLOWED_DEPT: 'Engineering',
    APPROVE_BLOCK: false,
    RUN_SOLVER: false,
    APPLY_RECOMMENDATION: false,
    SIGN_PTW: false,
    OVERRIDE_PRIORITY: false,
    GENERATE_TELEGRAPH: false,
    MANAGE_USERS: false,
    DATA_SYNC: false,
  },
  SNT_OFFICER: {
    SUBMIT_ANY_REQUEST: false,
    SUBMIT_OWN_DEPT: true,
    ALLOWED_DEPT: 'Signal & Telecom',
    APPROVE_BLOCK: false,
    RUN_SOLVER: false,
    APPLY_RECOMMENDATION: false,
    SIGN_PTW: false,
    OVERRIDE_PRIORITY: false,
    GENERATE_TELEGRAPH: false,
    MANAGE_USERS: false,
    DATA_SYNC: false,
  },
  TRD_ENGINEER: {
    SUBMIT_ANY_REQUEST: false,
    SUBMIT_OWN_DEPT: true,
    ALLOWED_DEPT: 'Traction Distribution',
    APPROVE_BLOCK: false,
    RUN_SOLVER: false,
    APPLY_RECOMMENDATION: false,
    SIGN_PTW: true, // Has authority to issue / verify 25kV PTW
    OVERRIDE_PRIORITY: false,
    GENERATE_TELEGRAPH: false,
    MANAGE_USERS: false,
    DATA_SYNC: false,
  },
  FIELD_CONTROLLER: {
    SUBMIT_ANY_REQUEST: false,
    SUBMIT_OWN_DEPT: false,
    SUBMIT_VOICE_MEMO: true,
    APPROVE_BLOCK: true,
    RUN_SOLVER: false,
    APPLY_RECOMMENDATION: false,
    SIGN_PTW: false,
    OVERRIDE_PRIORITY: true,
    GENERATE_TELEGRAPH: true,
    MANAGE_USERS: false,
    DATA_SYNC: false,
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING');
  const [availableUsers, setAvailableUsers] = useState([]);

  // Initialize Real-Time Connection and fetch latest user & personnel directory
  useEffect(() => {
    realtimeService.connect();
    const unsub = realtimeService.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    const refreshPersonnel = () => {
      authService.getRegisteredUsers().then(users => {
        if (users && users.length > 0) {
          setAvailableUsers(users);
        }
      });
    };

    refreshPersonnel();

    // Verify session profile against DB if user token exists
    if (authService.getToken()) {
      authService.fetchCurrentUser().then(freshUser => {
        if (freshUser) setUser(freshUser);
      }).catch(() => {});
    }

    const handleUserChanged = () => {
      refreshPersonnel();
    };

    window.addEventListener('railblock:user_changed', handleUserChanged);

    return () => {
      unsub();
      window.removeEventListener('railblock:user_changed', handleUserChanged);
      realtimeService.disconnect();
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(usernameOrEmail, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Role Checks derived exclusively from authenticated PostgreSQL DB record
  const currentRole = user?.role || null;
  const isPlannerAdmin = currentRole === 'PLANNER_ADMIN';
  const isCivilEngineer = currentRole === 'DEPT_ENGINEER';
  const isSntOfficer = currentRole === 'SNT_OFFICER';
  const isTrdEngineer = currentRole === 'TRD_ENGINEER';
  const isFieldController = currentRole === 'FIELD_CONTROLLER';
  const isDepartmentUser = isCivilEngineer || isSntOfficer || isTrdEngineer;

  const userDepartment = user?.department;

  // RBAC Permission Evaluator
  const hasPermission = (permKey) => {
    if (isPlannerAdmin) return true;
    const perms = ROLE_FEATURE_PERMISSIONS[currentRole] || {};
    return Boolean(perms[permKey]);
  };

  // Department Submission Check
  const canSubmitForDepartment = (deptName) => {
    if (isPlannerAdmin) return true;
    const allowed = ROLE_FEATURE_PERMISSIONS[currentRole]?.ALLOWED_DEPT;
    if (!allowed) return false;
    return deptName?.toLowerCase().includes(allowed.toLowerCase()) || allowed.toLowerCase().includes(deptName?.toLowerCase());
  };

  // Route Accessibility Check
  const canAccessRoute = (path) => {
    if (!user) return false;
    if (isPlannerAdmin) return true;
    const allowedRoutes = ROLE_ROUTE_PERMISSIONS[currentRole] || [];
    if (allowedRoutes.includes('*')) return true;
    return allowedRoutes.some(r => path.startsWith(r));
  };

  const canApproveSchedules = hasPermission('APPROVE_BLOCK');
  const canRunOptimization = hasPermission('RUN_SOLVER');
  const canSignPTW = hasPermission('SIGN_PTW');
  const canOverridePriority = hasPermission('OVERRIDE_PRIORITY');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      realtimeStatus,
      login,
      logout,
      currentRole,
      isPlannerAdmin,
      isCivilEngineer,
      isSntOfficer,
      isTrdEngineer,
      isFieldController,
      isDepartmentUser,
      userDepartment,
      hasPermission,
      canSubmitForDepartment,
      canAccessRoute,
      canApproveSchedules,
      canRunOptimization,
      canSignPTW,
      canOverridePriority,
      availableUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
