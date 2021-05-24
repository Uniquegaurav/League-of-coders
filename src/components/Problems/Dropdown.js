import React, { useState } from 'react'
import { useEffect } from 'react';
import {HiSortDescending } from "react-icons/hi";
import { HiSortAscending } from "react-icons/hi"
// import { likeQuestion } from '../../actions/posts';
// import { GrFavorite } from "react-icons/gr";
// import styled from "styled-components"
// import { MobileIcon } from '../Navbar/Navbar.elements';
import {Questions} from '../Data/Questions';
import { HeadingContent, HeadingCount,HeadingName, LoveReact, MarkSwitch, QuestionLink,QuestionList, 
    QuestionsContainer, 
     TopicBar ,TopicListIcon } from './Problems.elements'

const Dropdown = ({item,tindex}) => {
    const [click, setclick] = useState(false)
    // const [data, setdata] = useState([])
    const [quesComplCount, setquesComplCount] = useState(0)
    const handleclick = () =>{
        setclick(!click)
    }
    const handleCount = (currentToggle) =>{
        currentToggle ? setquesComplCount(prevCount => prevCount+1) :
        setquesComplCount(prevCount => prevCount-1)
    }
    
    const arr = Questions.filter(function(i){
        return i.topic === item;
    });
    
    const initialLoveClick =     JSON.parse(localStorage.getItem(`loveclickdata${tindex}`)) || Array(arr.length).fill(false);
    const [loveclick, setloveclick] = useState(initialLoveClick)
    const initialSwitch =   JSON.parse(localStorage.getItem(`switchState${tindex}`))||Array(arr.length).fill(false);
    const [switchState, setswitchState] = useState(initialSwitch)
    useEffect(() => {
            localStorage.setItem(`loveclickdata${tindex}` ,JSON.stringify(loveclick));
            localStorage.setItem(`switchState${tindex}` ,JSON.stringify(switchState));
    }, [loveclick,switchState])
      return (
        <div> 
            <TopicBar>
            <HeadingName>{item}</HeadingName><HeadingContent><HeadingCount>{switchState.filter(Boolean).length}</HeadingCount>
            <TopicListIcon onClick = {handleclick}>
                            {click ? <HiSortAscending/> : <HiSortDescending/>}
            </TopicListIcon></HeadingContent>
            </TopicBar>
            
            {click ?<QuestionsContainer>
                {   
                    arr.map( (que,index)=>
                    <QuestionList>
                    <QuestionLink href ={que.link}target="_blank">{que.name}</QuestionLink> 

                    <LoveReact isActive={loveclick[index]} onClick={()=>{
                            loveclick[index] = !loveclick[index] 
                            setloveclick([...loveclick])
                    }}
                     inactiveColor = "white" activeColor = "red" />
                    
                    <MarkSwitch onChange={()=>{
                        switchState[index] = !switchState[index]
                        handleCount(switchState[index])
                        setswitchState([...switchState])
                    }} checked={switchState[index]} />

                    </QuestionList>  
                )}
            </QuestionsContainer> : null}
        </div>
    )
}

export default Dropdown
