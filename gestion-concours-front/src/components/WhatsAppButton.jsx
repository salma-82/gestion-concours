import React from 'react';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp-float"
      href="https://wa.me/212776546095"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter ECONCOURS sur WhatsApp"
      title="Contacter ECONCOURS sur WhatsApp"
    >
      <svg className="whatsapp-icon" viewBox="0 0 448 512" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 224.1 32 101.5 32 1.6 131.9 1.5 254.5c0 39.1 10.2 77.3 29.6 110.9L0 480l117.7-30.9c32.4 17.7 68.9 27 106.2 27h.1c122.6 0 222.5-99.9 222.6-222.6 0-59.1-23-114.8-65.7-156.4zM224 438.7c-33.2 0-65.7-8.9-94.1-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.4-28.2-98.3C39.4 147.1 122.9 63.6 224 63.6c49 0 95.1 19.1 129.7 53.7 34.6 34.6 53.7 80.7 53.7 129.7-.1 101.2-82.5 184.7-183.4 191.7zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8s-14.3 18-17.6 21.7-6.5 4.2-12 1.4c-32.6-16.3-54-29.1-75.5-66.1-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7s-12.5-30.1-17.1-41.2c-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.5-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.7 83.7 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.4-2.3-5.1-3.7-10.6-6.5z" />
      </svg>
      <span className="whatsapp-float-label">Aide</span>
    </a>
  );
}
