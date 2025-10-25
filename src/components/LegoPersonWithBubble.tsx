import React, { useState } from 'react';
import quickTipsImage from '../assets/quicktips.png';

const LegoPersonWithBubble: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  const tips = [
    "Set clear rental terms and\navailability upfront",
    "Take clear photos of your\nitems from multiple angles",
    "Respond quickly to inquiries\nto increase bookings",
    "Maintain items in excellent\ncondition for better ratings",
    "Add detailed descriptions\nincluding condition and features",
    "Offer competitive pricing\nfor your item category",
    "Request feedback from renters\nto build your reputation",
    "Check items after each rental\nfor damage or issues",
  ];

  const handleClick = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '20px',
        cursor: 'pointer',
        flexWrap: 'wrap',
      }}
    >
      {/* LEGO Image */}
      <img
        src={quickTipsImage}
        alt="Quick Tips LEGO"
        style={{
          maxWidth: '280px',
          width: '100%',
          height: 'auto',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />

      {/* Speech Bubble Cloud */}
      <div
        style={{
          background: 'white',
          padding: '20px 24px',
          width: '280px',
          height: '140px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#000',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'pre-line',
          lineHeight: '1.6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '50px',
        }}
      >
        {tips[tipIndex]}

        {/* Cloud puff bumps */}
        <div
          style={{
            position: 'absolute',
            width: '35px',
            height: '35px',
            background: 'white',
            borderRadius: '50%',
            left: '-15px',
            top: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '28px',
            background: 'white',
            borderRadius: '50%',
            left: '-8px',
            top: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '30px',
            height: '30px',
            background: 'white',
            borderRadius: '50%',
            left: '-20px',
            top: '50px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />

        {/* Pointer small circle */}
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            background: 'white',
            borderRadius: '50%',
            left: '-45px',
            top: '55px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </div>
  );
};

export default LegoPersonWithBubble;
