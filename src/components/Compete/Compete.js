import React, { useEffect, useState } from 'react'
import GlowButton from '../Button/GlowButton'
import { MainContainer } from './Compete.elements'
import Create from './create/Create'
import Join from './join/Join'
import {Link} from 'react-router-dom'
import SIgninFirst from '../Others/SIgninFirst'
 
const Compete = () => {
  const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
  console.log(user,'Problems user')
  useEffect(() => {
    document.title = "League of coders - Compete"
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
