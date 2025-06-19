import {Outlet,Navigate} from 'react-router-dom'

export const ProtectedRoutes = () => {
    const token = sessionStorage.getItem('access_token')
    return token ? <Outlet /> : <Navigate to="/login" />;
};