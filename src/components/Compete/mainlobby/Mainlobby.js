import React from 'react'
import './mainlobby.css'
import Countdown from 'react-countdown';
import { useState } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'snackfy';

// window.onbeforeunload = (event) => {
//     const e = event || window.event;
//     // Cancel the event
//     e.preventDefault();
//     if (e) {
//       e.returnValue = ''; // Legacy method for cross browser support
//     }
//     return ''; // Legacy method for cross browser support
// };

const renderer = ({ hours, minutes, seconds, completed }) => {
    if (!completed) {
        return <span>{hours}:{minutes}:{seconds}</span>;
    }else{
        return <span></span>
    } 
  };
const Mainlobby = ({socket,roomcode ,isCreator}) => {
   
    const [mainData, setmainData] = useState([])
    const [allUsers, setallUsers] = useState([])
    const [totalTime, settotalTime] = useState(1555)
    const { enqueueSnackbar } = useSnackbar();
    
    // for question data and time interval
    useEffect(() => {
        document.title = "League of coders - Real time lobby"
        enqueueSnackbar({
            message: ' Working on scoring and question solved detection feature ..stay tune !'
          });
    }, [])
    useEffect(() => {
        try {
            socket.on('data',({data,timeinterval}) =>{
                console.log(data)
                    const array = []
                    const keys = Object.keys(data);
                    keys.forEach((i) =>{
                        array.push({name : data[i].name , url : data[i].url})
                    })
                    settotalTime(timeinterval);
                    setmainData(array);
            })
        } catch (error) {
            console.log(error);
        }
      
    }, [])

    // for user joining and leaving
    useEffect(() => {
        try {
            socket.on('users',(usersInRoom) =>{
                const array = []
                console.log('user render called',usersInRoom)
                const keys = Object.keys(usersInRoom);
                keys.map((i) =>{
                    array.push(usersInRoom[i].username)
                })
                setallUsers(array);              
            })
        } catch (error) {
            console.log(error);
        } 
    }, []) 
    
    const clockRef = useRef();
    const handleStart = () =>{
        try {
            socket.emit('starttest', roomcode, (error) => {
                if(error) {
                  alert(error);
                }
              });
        } catch (error) {
            console.log(error);
        }           
    }
    const [TestStarted, setTestStarted] = useState(false);
    const [TestEnded, setTestEnded] = useState(false);
    const [finalTime, setfinalTime] = useState(60000)
    // useEffect for starting the test ...
    useEffect(() => {
        try {
            socket.on('starttest',(teststarted) =>{
                if(!TestStarted){
                    setfinalTime(Date.now())
                    clockRef.current.start();
                    setTestStarted(true);
                }
            })  
        } catch (error) {
            console.log(error);
        }
               
    }, [])

    const handleComplete = () =>{
         setTestEnded(true)
    }
    const history = useHistory();
    const handleLeave = () =>{
        socket.disconnect() ;
        socket.off();
        history.push('/compete')
    }

    return (
        <>
            <div className  ="mainbox">
                    <div className = "heading-timer">
                        <div className = "headingTop">
                            <h1>This is heading</h1>

                        </div>
                        {!TestEnded&&<div className = "lobby-code">
                            <h1>{roomcode}</h1>
                        </div>}
                        {!TestEnded&&<div className = "countdownTimer">
                            <div className ="timer">
                                <Countdown onComplete = {handleComplete}  autoStart={false} ref={clockRef} date={finalTime + 60000*totalTime} renderer={renderer}/>
                            </div>
                        </div>}
                    </div>
                    <div className = "bodyContainer">

                           { 
                                !TestEnded&&<div className = "queContainer" >
                                    {
                                        TestStarted&&<ul  className = "question-list">
                                        {
                                        mainData.map( (que,index)=>{
                                            return <a href ={que.url} target="_blank" key = {index} className = "question-list-item">{que.name}</a>
                                        })
                                        }
                                    </ul>
                                    }
                                </div>
                            }

                            <div  className={ TestEnded ? 'sideContainerComplete' : 'sideContainer' }>
                                <div className = "userContainer">
                                    <ul className = "user-list">
                                    {
                                       allUsers.map( (user,index)=>{
                                           return <li  key = {index} >{user}</li>
    
                                       })
                                    }
                                    </ul>
                                </div>
                                <div className = "leavebutton">
                                       { (!TestStarted&&isCreator)&&<button onClick = {handleStart} className = "button69 buttonhov2">Start test</button>}
                                        <button onClick = {handleLeave} className = "button69 buttonhov1">Leave Lobby</button>
                                </div>
                            </div>                          
                    </div>
            </div>
        </>
    )
}

export default Mainlobby
