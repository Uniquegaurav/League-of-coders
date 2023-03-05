import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { io } from "socket.io-client";
import ErrorBoundary from '../../Common_components/Others/ErrorBoundary';
import Mainlobby from '../mainlobby/Mainlobby'
import './join.css'
let socket;
const Join = () => {    

    const ENDPOINT = 'https://league-of-coders.herokuapp.com';
    const userInstance  = JSON.parse(localStorage.getItem('profile'));
    const [user, setuser] = useState(userInstance);
    const [showlobby, setshowlobby] = useState(false);
    const [socketInstance, setsocketInstance] = useState(socket)
    const [errorMsg, seterrorMsg] = useState('')
    const [roomcode, setroomcode] = useState(111);
    
    useEffect(() => {
        document.title = "League of coders - join a lobby"
    }, [])

    useEffect(() => {
        setuser(JSON.parse(localStorage.getItem('profile')));
     }, [])

    const handleChange = (e) =>{
        setroomcode(parseInt(e.target.value));
    }

    const joinLobby = () =>{

        socket = io(ENDPOINT,  { transports: ['websocket', 'polling', 'flashsocket'] });
        setsocketInstance(socket);
        let username = user?.result?.name;
        try {
            if(username&&roomcode!==111){
                socket.emit('joinrequest',{roomid : roomcode});
                socket.on('joinresponse' ,({response}) =>{
                    if(response === 'canjoin'){
                        seterrorMsg('');
                        socket.emit('join',{roomid : roomcode,username : username} ,(error) =>{
                        })
                    }else{
                        socket.disconnect();
                        socket.off();
                        setshowlobby(false);
                        seterrorMsg(response);
                    }
                })
            }
        } catch (error) {
            console.log(error);
        }
    }
    const handleSubmit = (e) =>{
        e.preventDefault();
        joinLobby();
        setshowlobby(true);
    }
    console.log(errorMsg);
    if(!user?.result){
        return(
        <signinFirst msg ='Please Sign in to solve problems'/>
        )
    }
    if(!showlobby || errorMsg){
        return (
         
            <> <div className ="joinOuterContainer2"> 
                <form onSubmit = {handleSubmit} className = "formCotainer2" >
                        <div className = "headingJoin">
                            <p>ENTER LOBBY CODE !</p>
                        </div>
                        <input className ="inputLobby" required type = "text" onChange = {handleChange}/>
                       
                        <div className = "join-lobby-submit-box">
                            <input  type ="submit" value ="Join lobby"/>
                            {errorMsg&&<div className  = "error-box">
                                <div className = "error-msg"><p>{errorMsg}</p></div>
                            </div>}
                        </div>
                </form>
            </div>
            </>
        )
    }
    if(!errorMsg&&showlobby){
        return <ErrorBoundary><Mainlobby socket = {socketInstance}  roomcode ={roomcode}  isCreator =  {false} /></ErrorBoundary> 
    }  
}

export default Join
