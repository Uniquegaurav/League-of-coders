import React from 'react'
import Post from './Post/Post'
import useStyles from './styles'
import { Grid, CircularProgress } from '@material-ui/core';

import {useSelector} from 'react-redux';
 
const Posts = ({setCurrentId ,postActive,setpostActive}) => {
    const posts = useSelector(state => state.posts)
    console.log(posts)
    const classes = useStyles();
    return (
       
        !posts.length ? <CircularProgress /> : (
            <Grid className={classes.mainContainer} container alignItems="stretch" spacing={5}>

                {posts.map((post) => (
                    <Grid className = {classes.singlePostContainer} key={post._id} item xs={12} sm={6} md={6}>
                        <Post post={post} setCurrentId={setCurrentId}  postActive = {postActive} setpostActive = {setpostActive}/>
                    </Grid>
                    ))
                }
            </Grid>
        )
    )
}

export default Posts
