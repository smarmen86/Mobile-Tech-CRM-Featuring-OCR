import React from 'react';
import { User } from '../services/authService';
import { CSuiteDashboard } from '../components/dashboards/CSuiteDashboard';
import { ManagerDashboard } from '../components/dashboards/ManagerDashboard';
import { EmployeeDashboard } from '../components/dashboards/EmployeeDashboard';

interface DashboardPageProps {
     viewCustomer: (customerId: string) => void;
     user: User;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ viewCustomer, user }) => {
    // Route to appropriate dashboard based on user role
    switch (user.role) {
        case 'c-suite':
            return <CSuiteDashboard viewCustomer={viewCustomer} />;
        case 'manager':
            return <ManagerDashboard viewCustomer={viewCustomer} />;
        case 'employee':
            return <EmployeeDashboard viewCustomer={viewCustomer} />;
        default:
            return <EmployeeDashboard viewCustomer={viewCustomer} />;
    }
};
