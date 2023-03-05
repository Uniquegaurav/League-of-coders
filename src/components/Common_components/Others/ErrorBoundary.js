import React, { Component } from 'react'
import Error1 from './Error1'
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
    
        this.state = {
             hasError :false
        }
    }
    static getDerivedStateFromError(erro){
        return{
            hasError : true
        }
    }
    
    componentDidCatch(error,info) {
        console.log(error)
        console.log(info)
    }
    render() {
        if(this.state.hasError){
            return  <Error1  msg = "Something went wrong !!"/>
        }
        return this.props.children
    }
}

export default ErrorBoundary
