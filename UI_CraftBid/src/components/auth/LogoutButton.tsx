import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
    className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
    const { logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            console.log('Logout successful');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={cn(className)}
        >
            {isLoading ? 'Logging out...' : 'Log Out'}
        </button>
    );
};

export default LogoutButton;
