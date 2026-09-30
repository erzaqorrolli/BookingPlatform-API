import { useContext } from 'react';
import { CompanyContext } from '../contexts/CompanyContextValue';

export const useCompany = () => useContext(CompanyContext);
