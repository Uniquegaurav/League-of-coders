import React, { useState } from 'react'
import './PageHeader.css';
import { useEffect } from 'react';
import { PrimaryButton } from '../Common_components/Button/PrimaryButton';
import { GiCurlyWing} from "react-icons/gi";
import homeScreenBanner from "../../images/homebanner2.png";


const PageHeader = () => {

    const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
    console.log(user,'home user')
    useEffect(() => {
        setuser(JSON.parse(localStorage.getItem('profile')))
    }, [])
    return (
        <div className = 'header-main-container'>
    
            <div className = 'title-container' >
            <h1 className>A place to hone your programming skills</h1>
            <p>Coding platform for solving challenging problems in a competitive environment</p>x
            
            {(!user?.result)&&<div className  ="secondContainer">
                <p>Sign in to use all features<GiCurlyWing/></p>
                <PrimaryButton 
                    buttonStyle='btn--primary--outline'
                    buttonSize='btn--large'
                    buttonURL = '/sign-up'
                    >
                    SIGN IN
               </PrimaryButton >
           </div>}
           {
           <div className  ="secondContainer">
                <p>{(!user?.result) ? 'Check all the recent updates available' : 'Practice problems and level up your skills' }<GiCurlyWing/></p>
                <PrimaryButton 
                    buttonStyle='btn--primary--outline'
                    buttonSize='btn--large'
                    buttonURL = {(!user?.result) ? '/updates': '/compete' }
                    >GET STARTED</PrimaryButton >
           </div>
          }
            </div>
            <div>
            <img className='banner' src={homeScreenBanner} alt="Logo" />;
            </div>
           
        </div>
        
    )
}

export default PageHeader
