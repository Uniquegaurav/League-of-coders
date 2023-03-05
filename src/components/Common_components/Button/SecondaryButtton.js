import styled from 'styled-components'

export const SecondaryButton = styled.button`
  border-radius: 4px;
  background: rgb(81 129 65);
  white-space: nowrap;
  padding: ${({ big }) => (big ? '12px 64px' : '10px 20px')};
  color: #fff;
  font-size: ${({ fontBig }) => (fontBig ? '20px' : '16px')};
  outline: none;
  border: none;
  cursor: pointer;
  &:hover {
    transition: all 0.3s ease-out;
    background: #fff;
    background-color: rgb(81 129 65);
  }
  @media screen and (max-width: 960px) {
    width: 100%;
  }
`;