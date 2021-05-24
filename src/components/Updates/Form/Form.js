import React from 'react'
import useStyles from './styles'
import { TextField, Button, Typography, Paper } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import FileBase from 'react-file-base64';
import { useState } from 'react';
import { createPost ,updatePost} from '../../../actions/posts';
import { useEffect } from 'react';
import { useSnackbar } from 'snackfy';

// Get the current id of the post we are on

const Form = ({currentId,setCurrentId ,postActive,setpostActive}) => {
    const [postData, setpostData] = useState(
        {
            title : '',
            message :'',
            tags  :'',
            selectedFile : ''
        }
    )
    const post = useSelector(state => currentId ?  state.posts.find(p => p._id === currentId) : null)
    useEffect(() => {
       if(post) setpostData(post)
    }, [post])

    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useDispatch();
    const user = JSON.parse(localStorage.getItem('profile'));

    const handleSubmit = (e) =>{
        e.preventDefault();
        if(currentId){
            dispatch(updatePost(currentId,{...postData ,name  : user?.result.name}));
            enqueueSnackbar({
                message: 'Post Updated'
              });
        }else{
            dispatch(createPost({...postData ,name  : user?.result.name}));
            enqueueSnackbar({
                message: 'New Post Added!'
              });
        }
        setpostActive(!postActive);
        clear();
    }
    const clear = () =>{
        setCurrentId(null);
        setpostData({
            title : '',
            message :'',
            tags  :'',
            selectedFile : ''
        })
    }
    if(!user?.result){
        return(
            <Paper className = {classes.paper}>
                <Typography variant ="h6" align ="center">
                    Please Sign in to add a new Post !!!!!
                </Typography>
            </Paper>
        )
    }
    return (
        <Paper className = {classes.paper}>
            <form autoComplete = "off" noValidate className = {`${classes.root} ${classes.form}`} onSubmit = {handleSubmit}>
                <Typography variant ="h6"> {currentId ? 'EDITING' : 'ADDING'} A POST</Typography>

                <TextField name = "title" variant = "outlined" label ="Heading" fullWidth 
                 value ={postData.title} 
                 onChange ={(e) => setpostData({ ...postData , title : e.target.value})}/>

                <TextField name = "message" variant = "outlined" label ="Message" fullWidth 
                 value ={postData.message} 
                 onChange ={(e) => setpostData({ ...postData , message : e.target.value})}/>

                <TextField name = "tags" variant = "outlined" label ="Single Url" fullWidth 
                 value ={postData.tags} 
                 onChange ={(e) => setpostData({ ...postData , tags : e.target.value})}/>

                <div className={classes.fileInput}><FileBase type="file" multiple={false} 
                  onDone={({ base64 }) => setpostData({ ...postData, selectedFile: base64 })} /></div>

                <Button className={classes.buttonSubmit} variant="contained" color="primary" 
                    size="large" type="submit" fullWidth>Submit</Button>
                <Button variant="contained" color="secondary" 
                    size="small" onClick={clear} fullWidth>Clear</Button>

            </form>

        </Paper>
    )
}

export default Form
