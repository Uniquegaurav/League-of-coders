import React from 'react';
import './App.css';
import { Navbar } from './components';
import {HashRouter as Router ,Route} from 'react-router-dom'
import GlobalStyle from './globalStyle';
import Home from './components/Home/Home';
import Compete from './components/Compete/Compete';
import Problems from './components/Problems/Problems';
import Updates from './components/Updates/Updates';
import Login from './components/Login/Login';
import Join from './components/Compete/join/Join';
import Create from './components/Compete/create/Create';
import AddFeedback from './components/Others/AddFeedback';
function App() {
  return (
    <div className="App">
      <Router>
         <GlobalStyle/>
         <Navbar/>
         <switch>
          <Route path ="/" exact component = {Home} />
          <Route path ="/compete" exact component = {Compete} />
          <Route path ="/problems" component = {Problems} />
          <Route path ="/updates" component = {Updates} />
          <Route path ="/sign-up" component = {Login} />
          <Route path ="/compete/join" exact component = {Join} />
          <Route path ="/compete/create" component = {Create} />
          <Route path ="/feedback" component = {AddFeedback} />
        </switch>
      </Router>
    </div>
  );
}

export default App;
