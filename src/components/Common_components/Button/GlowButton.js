import React from 'react'
import './GlowButton.css'
const GlowButton = ({ButtonText}) => {
    return (
        <div class = "GlowButton-container">
            <button class="glow-on-hover" type="button">{ButtonText}</button>
        </div>
    )
}

export default GlowButton 
