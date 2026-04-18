import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const [permissions] = useState({
    canAccessPlatformSettings: true,
    canAccessRevenue: true,
    canVerifyUsers: true,
    canManageUsers: true,
  });

  return permissions;
};

export const hasPermission = (permission) => {
  return true;
};
