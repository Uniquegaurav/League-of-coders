import React from 'react'

import { Container, AppBar, Grow, Grid,Button} from '@material-ui/core';
import Posts from './Posts/Posts';
import Form from './Form/Form';
import useStyles from './updatestyles'
import {useDispatch} from 'react-redux';
import { useEffect } from 'react';
import { IoReturnUpBackOutline} from "react-icons/io5";
import {getPost} from '../../actions/posts'
import { useState } from 'react';
import ErrorBoundary from '../Common_components/Others/ErrorBoundary';

const Updates = () => {
    useEffect(() => {
        document.title = "Coders League - Updates"
    }, [])
    const classes = useStyles();
    const dispatch = useDispatch();
    const [currentId, setCurrentId] = useState(null);

    const [postActive, setpostActive] = useState(true);

    useEffect(() => {
        dispatch(getPost());
    }, [currentId,dispatch])
    
    return (

        <div className ={classes.topMainBox} >
         <div  className = {classes.divclass}>
            <Button variant="contained" color="lightpink" 
                 style={{ width: '14rem' ,height : '3rem' ,fontSize : '18px',fontWeight : 'bold'}}
                 onClick = {()=> setpostActive(!postActive)}>
                 {postActive? 'ADD NEW POST' :'ALL POSTS' }</Button>
         </div>
        <Container maxWidth = "lg">
            <AppBar className ={classes.appBar} position = "static" color ="inherit" >

                {/* <Typography className = {classes.heading} variant="h2" align="center">Memories</Typography>
                <img className ={classes.image} src={postimage} alt="icon" height="60" /> */}
            </AppBar>
            <Grow in>
                <Grid container justify = "center" alignItems = "stretch" spacing = {3}>
                     {

                     postActive ? <Grid className = {classes.contentsContainer} item xs = {12} sm = {7}>
                         <ErrorBoundary> <Posts setCurrentId ={setCurrentId} postActive = {postActive} setpostActive = {setpostActive}/></ErrorBoundary>
                     </Grid> :
                     <Grid item xs = {12} sm = {4}>
                         <ErrorBoundary> <Form currentId = {currentId} setCurrentId ={setCurrentId} postActive = {postActive} setpostActive = {setpostActive}/></ErrorBoundary>                   
                    </Grid>
                     }
                </Grid>
            </Grow>
        </Container>
        </div>
    )
}

export default Updates
