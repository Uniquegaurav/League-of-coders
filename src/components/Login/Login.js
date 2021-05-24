import React, { useEffect } from 'react'
import ErrorBoundary from '../Others/ErrorBoundary';
import { Auth } from './Auth';
import './Login.css';

function Login() {
    useEffect(() => {
        document.title = "League of coders - Sign in"
    }, [])
    return (
        <div className ="login-container">  
         <ErrorBoundary><Auth/></ErrorBoundary>
        </div>
    )
}

export default Login
