import React, { useEffect, useState } from 'react'
import GlowButton from '../Common_components/Button/GlowButton'
import { MainContainer } from './Compete.elements'
import {Link} from 'react-router-dom'
import SIgninFirst from '../Common_components/Others/SIgninFirst'
 
const Compete = () => {
  const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
  console.log(user,'Problems user')
  useEffect(() => {
    document.title = "Coders League - Compete"
   }, [])
  useEffect(() => {
      setuser(JSON.parse(localStorage.getItem('profile')))
  }, [])

  if(!user?.result?.name){
      return(
      <SIgninFirst msg ='Please sign in to compete'/>
      )
  }
    return (
        <MainContainer>
          <div>
            <Link to = '/compete/create'>
                 <GlowButton ButtonText = "CREATE LOBBY"/>
            </Link>
            <Link to = '/compete/join'>
                 <GlowButton ButtonText = "JOIN LOBBY"/>
            </Link>
          </div>
        </ MainContainer>
    )
}

export default Compete
