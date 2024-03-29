import React, { useEffect } from 'react'
import ErrorBoundary from '../Common_components/Others/ErrorBoundary';
import { Auth } from './Auth';
import './Login.css';

function Login() {
    useEffect(() => {
        document.title = "Coders League - Sign in"
    }, [])
    return (
        <div className ="login-container">  
         <ErrorBoundary><Auth/></ErrorBoundary>
        </div>
    )
}

export default Login
