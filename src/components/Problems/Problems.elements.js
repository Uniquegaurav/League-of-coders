import styled from "styled-components"
import Heart from "react-heart"
import Switch from "react-switch";
export const MainContainer = styled.div`
    background: #6441A5;  /* fallback for old browsers */
    background: -webkit-linear-gradient(to right, #2a0845, #6441A5);  /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #2a0845, #6441A5); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    width: 100%;
    display: flex;
    padding-top : 125px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.2);
    object-fit: contain;
`
export const TopicBar  = styled.div`
  background : white;
  min-height : 10vh;
  font-size : 1.95rem;
  width : 75vw;
  display : flex;
  flex-direction : row;
  justify-content : center;
  align-items : center;
  margin : 40px;
  background : linear-gradient(
      to right bottom,
      rgba(255,255,255,0.7),
      rgba(255,255,255,0.3)
  );
  border-radius : 2rem;
  backdrop-filter : blur(2rem);
  @media screen and (max-width: 960px) {
   font-size : 1.25rem;
  }
`
export const HeadingContent = styled.div`
 display: flex;
 flex-direction: row;
 align-items: center;
 justify-content: space-evenly;
 width: 17%;
`
export const HeadingName = styled.div`
 margin-left: 15%;
 width: 80%;
`
export const HeadingCount = styled.div`
margin-left: -30px;
`
export const TopicListIcon = styled.div`
    padding-top: 10px;
    cursor: pointer;
`;

export const QuestionsContainer = styled.div `
width :auto;
height : auto;
border : 2px solid white;
display : flex;
flex-direction :column;
justify-content : center;
`
export const QuestionList = styled.li`
  display :flex;
  flex-direction :row;
  /* justify-content : space-around; */
  height : 50px;
  align-items : center;
  background : rgb(10,10,10,0.73);
  margin : 15px;
  &:hover {
    border-bottom: 1px solid greenyellow;
    color : lightskyblue;
  }
  @media screen and (max-width: 960px) {
    min-height : 65px;
    max-height : 70px;
    height : fit-content;
  }
`
export const QuestionLink = styled.a`
font-size : 1.2rem;
color : #E6E6FA;
/* lighseagreen */
width : 86%;
text-decoration: none;
font-family: Arial, Helvetica, sans-serif;
font-weight : 400;
&:visited {
  color : lightseagreen;
}
&:hover {
    color : lightskyblue;
  }
`
export const LoveReact = styled(Heart)`
  /* position : absolute;
  align-items : center;
  right : 200px; */
  width : 7%;
  order : 3;
  height : 24px;
  /* width : 24px; */
  @media screen and (max-width: 960px) {
    display : none;
  }
`;

export const MarkSwitch = styled(Switch)`
  /* position : absolute;
  align-items : center;
  right : 300px; */
  width : 7%;
  order: 2;
  height : 24px;
  /* width : 24px; */

`;