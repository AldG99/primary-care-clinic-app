import { useContext } from 'react';
import { AlertContext } from '../context/AlertContext';

export const useAlerts = () => {
  return useContext(AlertContext);
};
