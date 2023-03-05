import React from 'react';
import './PrimaryButton.css';
import { Link } from 'react-router-dom';

const STYLES = ['btn--primary', 'btn--primary--outline'];

const SIZES = ['btn--medium', 'btn--large'];

export const PrimaryButton = ({
  children,
  type,
  onClick,
  buttonStyle,
  buttonSize,
  buttonURL
}) => {
  const checkButtonStyle = STYLES.includes(buttonStyle)
    ? buttonStyle
    : STYLES[0];

  const checkButtonSize = SIZES.includes(buttonSize) ? buttonSize : SIZES[0];

  return (
    <Link to={buttonURL}>
      <button
        className={`btn ${checkButtonStyle} ${checkButtonSize}`}
        onClick={onClick}
        type={type}
      >
        {children}
      </button>
    </Link>
  );
};