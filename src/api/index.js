import axios from 'axios';

const API = axios.create({baseURL : 'https://league-of-coders.herokuapp.com'});

API.interceptors.request.use((req) =>{
    if(localStorage.getItem('profile')){
        req.headers.Authorization = `Bearer ${JSON.parse(localStorage.getItem('profile')).token}`;
    }
    return req;
});

export const fetchPosts = () => API.get('/posts');

export const  createPost  = (newPost) => API.post('/posts',newPost)

export const updatePost =(id,updatePost) => API.patch(`/posts/${id}`,updatePost)

export const deletePost  = (id) => API.delete(`/posts/${id}`);

export const likePost = (id) => API.patch(`/posts/${id}/likePost`);

export const signIn = (formData) => API.post('/users/signin',formData);

export const signUp = (formData) => API.post('/users/signup',formData);

// // for Questions 
// const url = 'http://localhost:5000/questions';

// export const likeQuestion = (id,likevalue) => axios.patch(`${url}/${id}/likeQuestion`,likevalue);
