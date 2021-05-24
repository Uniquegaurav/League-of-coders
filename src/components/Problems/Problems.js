import React, { useState } from 'react'
import { useEffect } from 'react';
import { MainContainer } from './Problems.elements'
import {Topics} from '../Data/Topics'
import Dropdown from './Dropdown';
import SIgninFirst from '../Others/SIgninFirst';
import ErrorBoundary from '../Others/ErrorBoundary';

const Problems = () => {
    
    useEffect(() => {
        document.title = "League of coders - Solve problems"
    }, [])
    const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
    console.log(user,'Problems user')
    useEffect(() => {
        setuser(JSON.parse(localStorage.getItem('profile')))
    }, [])

    if(!user?.result){
        return(
        <SIgninFirst msg ='Please sign in to solve problems'/>
        )
    }
    return (
        <div>
        <MainContainer>
        { 
            Topics.map( (item,index) =>{
                return(
                    <ErrorBoundary><Dropdown item = {item} tindex = {index}/></ErrorBoundary>
                )
            })
        }
        </ MainContainer>
        </div>
    )
}

export default Problems
