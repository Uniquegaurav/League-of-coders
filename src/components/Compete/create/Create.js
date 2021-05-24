import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import {Link} from 'react-router-dom'
import { io } from "socket.io-client";
import Mainlobby from '../mainlobby/Mainlobby';
import {Questions}  from '../../Data/Questions'

import './create.css'
import { useReducer } from 'react';
import ErrorBoundary from '../../Others/ErrorBoundary';
import signinFirst from '../../Others/SIgninFirst';
import { QuestionsHard, QuestionsMedium ,QuestionsEasy} from '../../Data/Questions2';
let socket;
const Create = () => {
    
    const userInstance  = JSON.parse(localStorage.getItem('profile'));
    const [user, setuser] = useState(userInstance);
    const [roomcode, setroomcode] = useState(111);
    const ENDPOINT = 'https://league-of-coders.herokuapp.com';
    const [socketInstance, setsocketInstance] = useState(socket)
    const [errorMsg, seterrorMsg] = useState('')
    const [showlobby, setshowlobby] = useState(false)

    useEffect(() => {
        document.title = "League of coders - create a new lobby"
    }, [])
    useEffect(() => {
        
        setuser(JSON.parse(localStorage.getItem('profile')));
     }, [])
    const initialFormState = {
        timeinterval : 60, easyq : 2 , mediumq : 1 , hardq : 0
    }
    const [formData, setformData] = useState(initialFormState)
    const handleChange = (e) =>{
        setformData({ ...formData,[e.target.name] : e.target.value});
        console.log(formData,'while changing')
    }
  
    var questionData;
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) { 
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }  
        return array;
     }
    const filterQuestions = () =>{

        let e = parseInt(formData.easyq);
        let m = parseInt(formData.mediumq);
        let h = parseInt(formData.hardq);
        let totale = QuestionsEasy.length;
        let totalm = QuestionsMedium.length;
        let totalh = QuestionsHard.length;
        console.log(totale,totalm,totalh);
        var arr1 = [];
        while(arr1.length < e){
            var r = Math.floor(Math.random() * totale) + 1;
            if(arr1.indexOf(r) === -1) arr1.push(r);
        }
        var arr2 = [];
        while(arr2.length < m){
            var r = Math.floor(Math.random() * totalm) + 1;
            if(arr2.indexOf(r) === -1) arr2.push(r);
        }
        var arr3 = [];
        while(arr3.length < h){
            var r = Math.floor(Math.random() * totalh) + 1;
            if(arr3.indexOf(r) === -1) arr3.push(r);
        }
        var filteredQuestions = []
        for(let i =0 ; i<arr1.length ;i++){
            filteredQuestions.push(QuestionsEasy[arr1[i]]);
        }
        for(let i =0 ; i<arr2.length ;i++){
            filteredQuestions.push(QuestionsMedium[arr2[i]]);
        }
        for(let i =0 ; i<arr3.length ;i++){
            filteredQuestions.push(QuestionsHard[arr3[i]]);
        }
        filteredQuestions = shuffleArray(filteredQuestions);
        return filteredQuestions;
    }
  
    const createLobby = () =>{

        const questionData =  filterQuestions();
        var roomcode = Math.floor(1000 + Math.random() * 9000);
        setroomcode(roomcode);
        socket =  io(ENDPOINT,  { transports: ['websocket', 'polling', 'flashsocket'] });
        setsocketInstance(socket);
        let username = user?.result?.name;
        const timeinterval = parseInt(formData.timeinterval);
        try {
            if(username){
                socket.emit('create',{roomid : roomcode,username : username,data : questionData,timeinterval } ,(error) =>{
                    seterrorMsg(error);
            })
            }else{
                seterrorMsg('Something went wrong Please Sign in and try again!!!')
            }
        } catch (error) {
            console.log(error);   
        }
    }

    const handlesubmit = (e) =>{
        e.preventDefault();
        createLobby();
        setshowlobby(true)
    }
    console.log(formData,'before rndering');
    console.log(errorMsg);
    if(!user?.result){
        return(
        <signinFirst msg ='Please Sign in to solve problems'/>
        )
    }
    return (
        <> 
        {
           
        showlobby ? <ErrorBoundary><Mainlobby socket = {socketInstance} roomcode = {roomcode} isCreator =  {true}/></ErrorBoundary> 
            :<div className ="createOuterContainer">
            <form className = "formContainer" onSubmit = {handlesubmit} >

                <div className = "headingCreate">
                     <p>ENTER LOBBY DETAILS !</p>
                </div>

                <div className = "labelBox" >
                    <label className = "labelClass">Time (minutes):</label>
                    <input onChange ={handleChange} className ="input-box" value = {formData.timeinterval} type="number" name="timeinterval" min="30" max="180" step="30"/>
                </div>

                <div className = "labelBox" >
                    <label className = "labelClass">Easy</label>
                    <label className = "labelClass">Medium</label>
                    <label className = "labelClass">Hard</label>
                </div>

                <div className = "queBox" >
                    <input onChange ={handleChange} value = {formData.easyq} className ="input-box" type="number"  name="easyq" min="1" max="7"/>
                    <input onChange ={handleChange} value = {formData.mediumq} className ="input-box" type="number"  name="mediumq" min="1" max="5"/>
                    <input onChange ={handleChange} value = {formData.hardq} className ="input-box" type="number"  name="hardq" min="0" max="4"/>
                </div>

                <div className = "last-box">
                    <input classsName = "submitButton" type ="submit" value ="Create lobby"/>
                    {errorMsg&&<div className  = "error-box">
                        <div className = "error-msg"><p>{errorMsg}</p></div>
                    </div>}
                </div>
                
            </form>
        </div>
        }
        </>
    )
}

export default Create
