import React, { useState } from 'react'
import { useEffect } from 'react';
import { MainContainer } from './Problems.elements'
import { Topics } from '../../data/Topics';
import Dropdown from './Dropdown';
import SIgninFirst from '../Common_components/Others/SIgninFirst';
import ErrorBoundary from '../Common_components/Others/ErrorBoundary';

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
