import React, { useEffect, useState } from 'react'
import { Card, CardActions, CardContent, CardMedia, Button, Typography, Container } from '@material-ui/core/';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbUpAltOutlinedIcon from '@material-ui/icons/ThumbUpAltOutlined';
import DeleteIcon from '@material-ui/icons/Delete';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import useStyles from './styles';
import { deletePost ,likePost } from '../../../../actions/posts';

const Post = ({post ,setCurrentId,postActive,setpostActive}) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const [user, setuser] = useState(JSON.parse(localStorage.getItem('profile')))
    useEffect(() => {
        setuser(JSON.parse(localStorage.getItem('profile')))
    }, [])

    const handleClick = () =>{
        setpostActive(!postActive);
        setCurrentId(post._id)
    }

    const Likes = () =>{
        if(post.likes.length>0){
            return post.likes.find((like) => like === (user?.result?.googleId||user?.result?._id))
            ? ( <><ThumbUpIcon fontSize ="small" />&nbsp;{`${post.likes.length} like${post.likes.length>1?'s':''}` }</> 
            ) : (<><ThumbUpAltOutlinedIcon fontSize ="small" />&nbsp;{`${post.likes.length} like${post.likes.length>1?'s':''}` }</>)
        }
        return  <><ThumbUpAltOutlinedIcon fontSize ="small" />&nbsp;like</>
    };
    const imageStyle = {
        backgroundColor : !post.selectedFile ? "#8e89ff" : null,
      };
    const [imagefull, setimagefull] = useState(false)
    return (
        <Card className = {classes.card}>
            {
            <CardMedia style = {imageStyle} onClick ={() => setimagefull(!imagefull)}
                     className = {imagefull ? classes.fullmedia : classes.media} 
                     image={post.selectedFile} title={post.title}/> }
            <Container className = {classes.postBodyContainer} style={{ display: imagefull ? 'none' : null }} >
            
                    <div className={classes.overlay}>
                        <Typography variant="h6">{post.name}</Typography>
                        <Typography variant="body2">{moment(post.createdAt).fromNow()}</Typography>
                    </div>
                    {(user?.result?.googleId === post?.creator || user?.result?._id === post?.creator)&&(
                    <div className={classes.overlay2}>
                        <Button style={{ color: 'white' }} size="small" 
                            onClick={handleClick}><MoreHorizIcon fontSize="default" /></Button>
                    </div>
                    )}
                    <div className={classes.details}>
                        <Typography variant="body2" color="textSecondary" component="h2">
                            {post.tags&&<a className = {classes.tagdesign} target="_blank" href ={post.tags.trim()}>Go to the given link</a>}
                        </Typography>
                    </div>

                    <Typography className={classes.title} gutterBottom variant="h5"
                                        component="h2">{post.title}</Typography>

                <CardContent className ={classes.messageBoxDesign} >
                        <Typography variant="body2" color="textSecondary" component="p">{post.message}</Typography>
                </CardContent>

                <CardActions className={classes.cardActions}>

                        <Button disabled= {!user?.result} size="small" color="primary" onClick={() =>dispatch(likePost(post._id))}>
                            <Likes/> </Button>
                        {console.log( post?.creator)}
                        {console.log( user?.result?.googleId)}
                        {(user?.result?.googleId === post?.creator || user?.result?._id === post?.creator)&&(
                            <Button size="small" color="primary" onClick={() =>{dispatch(deletePost(post._id))}}>
                            <DeleteIcon fontSize="small" /> Delete</Button>
                        )}
                    </CardActions>
             </Container>
        </Card>
    )
}

export default Post
