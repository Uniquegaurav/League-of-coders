import React from 'react'
import Feedback from "feeder-react-feedback";
import "feeder-react-feedback/dist/feeder-react-feedback.css"; 
import './AddFeedBack.css'
const AddFeedback = () => {

    return (
        <div className=  'mainContainer'>
          <div>
          <section className ="sectionClass">
                <details className = "detailsClass">
                    <summary>How it works</summary>
                    <p>
                        yet to be added
                    </p>
                </details>
                <details className = "detailsClass">
                    <summary>Join our team</summary>
                    <p>yet to be added</p>
                </details>
                <details className = "detailsClass">
                    <summary>Contact us</summary>
                    <p> yet to be added </p>
                </details>
                <details className = "detailsClass">
                    <summary>New Features</summary>
                    <p> yet to be added </p>
                </details>
          </section>
          </div>
            <Feedback email = {true} projectId="60a94173cfcadd00048e5a97" />
        </div>
    )
}

export default AddFeedback
