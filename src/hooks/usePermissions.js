import { useState, useEffect } from 'react';
import api from '../api/axios';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    canAccessPlatformSettings: false,
    canAccessRevenue: false,
    canVerifyUsers: false,
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/admin-users');
      const permissions =
        response.data?.data?.[0]?.permissions; 

      if (permissions) {
        setPermissions(prev => ({
          ...prev,
          ...permissions
        }));
      }

    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  return permissions;
};

export const hasPermission = (permissions, checkPermission) => {
  return permissions?.[checkPermission] === true;
};