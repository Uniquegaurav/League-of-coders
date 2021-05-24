import styled from "styled-components"
export const MainContainer = styled.div`
    background: #000046;  /* fallback for old browsers */
    background: -webkit-linear-gradient(to right, #000046, #1CB5E0);  /* Chrome 10-25, Safari 5.1-6 */
    background: linear-gradient(to right, #000046, #1CB5E0); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
    height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 0 1000px rgba(0, 0, 0, 0.2);
    object-fit: contain;
`