import {Navigate} from 'react-router-dom'

export const Logout = () => {
    localStorage.clear()
    return <Navigate to="/login" />;
};