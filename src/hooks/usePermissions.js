import { useState, useEffect } from 'react';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    canAccessPlatformSettings: true,
    canAccessRevenue: true,
    canVerifyUsers: true,
    canManageUsers: true,
  });

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        if (user.permissions) {
          setPermissions(user.permissions);
        }
      } catch (error) {
        console.error('Error parsing admin user:', error);
      }
    }
  }, []);

  return permissions;
};

export const hasPermission = (permission) => {
  const adminUser = localStorage.getItem('adminUser');
  if (!adminUser) return false;

  try {
    const user = JSON.parse(adminUser);
    if (!user.permissions) return true;
    return user.permissions[permission] === true;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};
