import React, { useEffect } from 'react'
import Footer from '../Footer/Footer'
import PageHeader from './PageHeader'

const Home = () => {
    useEffect(() => {
        document.title = "Coders League"
    }, [])
    return (
        <div>
             <PageHeader/>
            <Footer/>
        </div>
    )
}

export default Home
