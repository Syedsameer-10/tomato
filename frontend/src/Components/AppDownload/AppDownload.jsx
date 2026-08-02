import React from 'react'
import './AppDownload.css'
const AppDownload = () => {
  return (
    <section className='app-download' id='app-download'>
      <div className="app-download-content">
        <div>
          <span className="app-download-label">Mobile app</span>
          <h2>Tomato is coming to your phone soon</h2>
          <p>Keep ordering from the website while we prepare a faster mobile experience for repeat orders, saved addresses, and order updates.</p>
        </div>
        <div className="app-download-status" aria-label="Mobile app launch status">
          <strong>Coming soon</strong>
          <span>Android and iOS</span>
        </div>
      </div>
    </section>
  )
}

export default AppDownload
