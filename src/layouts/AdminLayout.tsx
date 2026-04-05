import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminLayout = ({ children }) => {
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            setIsAuthLoading(true);
            // Simulating delay for localStorage hydration
            await new Promise(resolve => setTimeout(resolve, 100));
            const auth = localStorage.getItem('auth');
            // Add your actual auth check logic here
            if (auth === 'admin') {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
            setIsAuthLoading(false);
            setAuthChecked(true);
        };

        verifyAuth();
    }, []);

    if (isAuthLoading) {
        return <LoadingSpinner message="Verifying admin access..." />;
    }

    if (!authChecked) {
        return null; // Or a placeholder while loading
    }

    if (!isAuthorized) {
        return <div>Unauthorized access</div>;
    }

    return <div>{children}</div>;
};

export default AdminLayout;