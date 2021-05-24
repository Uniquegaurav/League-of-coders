import React, { useState } from 'react'
import { useEffect } from 'react';
import { Button } from '../Button/Button'
import './PageHeader.css';
import { GiCurlyWing} from "react-icons/gi";


const PageHeader = () => {

    const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
    console.log(user,'home user')
    useEffect(() => {
        setuser(JSON.parse(localStorage.getItem('profile')))
    }, [])
    return (
        <div className = 'pageheader-container'>
            <h1 className>A place to hone your computer programming skills</h1>
            <p>Loc is a coding platform for solving selected dsa problems in a competitive test like environment</p>
            
            {(!user?.result)&&<div className  ="secondContainer">
                <p>Sign in to use all features<GiCurlyWing/></p>
                <Button
                    className='btns'
                    buttonStyle='btn--outline'
                    buttonSize='btn--large'
                    buttonURL = '/sign-up'
                    >
                    SIGN IN
               </Button>
           </div>}
           {
           <div className  ="secondContainer">
                <p>{(!user?.result) ? 'Check all the recent updates available' : 'Practice problems and level up your skills' }<GiCurlyWing/></p>
                <Button
                    className='btns'
                    buttonStyle='btn--outline'
                    buttonSize='btn--large'
                    buttonURL = {(!user?.result) ? '/updates': '/compete' }
                    >GET STARTED</Button>
           </div>
          }
        </div>
        
    )
}

export default PageHeader
