import React, { useState } from 'react';

interface LegoPersonProps {
  quickTips?: string[];
  onTipChange?: (tipIndex: number) => void;
}

const LegoPerson: React.FC<LegoPersonProps> = ({
  quickTips = [
    "Complete rentals & maintain\nyour tools for 5-star reviews!",
    "Set competitive prices to\nattract more renters!",
    "Keep your items in great\ncondition for better ratings!",
    "Stay active & respond quickly\nto rental requests!",
    "Update your availability\nregularly for visibility!",
  ],
  onTipChange,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  const handleClick = () => {
    const nextTipIndex = (tipIndex + 1) % quickTips.length;
    setTipIndex(nextTipIndex);
    onTipChange?.(nextTipIndex);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
      }}
    >
      {/* Speech Bubble */}
      <div
        style={{
          background: 'white',
          border: '2px solid #000',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          maxWidth: '200px',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          position: 'relative',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          whiteSpace: 'pre-line',
          lineHeight: '1.4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {quickTips[tipIndex]}
        {/* Pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '30px',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid white',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10px',
            left: '29px',
            width: 0,
            height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '9px solid #000',
          }}
        />
      </div>

      {/* LEGO Figure - Simple CSS version */}
      <div style={{ position: 'relative', width: '60px', height: '100px' }}>
        {/* Head */}
        <div
          style={{
            width: '40px',
            height: '40px',
            background: '#ffdb5d',
            borderRadius: '4px',
            position: 'absolute',
            top: '0',
            left: '10px',
            border: '1px solid #d4af37',
            boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.8)',
          }}
        >
          {/* Eyes */}
          <div
            style={{
              width: '6px',
              height: '6px',
              background: '#000',
              borderRadius: '50%',
              position: 'absolute',
              top: '12px',
              left: '8px',
            }}
          />
          <div
            style={{
              width: '6px',
              height: '6px',
              background: '#000',
              borderRadius: '50%',
              position: 'absolute',
              top: '12px',
              right: '8px',
            }}
          />
          {/* Smile */}
          <div
            style={{
              width: '12px',
              height: '2px',
              background: '#000',
              position: 'absolute',
              bottom: '8px',
              left: '14px',
              borderRadius: '1px',
            }}
          />
          {/* Head studs (dots) */}
          <div
            style={{
              width: '4px',
              height: '4px',
              background: '#d4af37',
              borderRadius: '50%',
              position: 'absolute',
              top: '-6px',
              left: '8px',
              border: '1px solid #b8860b',
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              background: '#d4af37',
              borderRadius: '50%',
              position: 'absolute',
              top: '-6px',
              left: '18px',
              border: '1px solid #b8860b',
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              background: '#d4af37',
              borderRadius: '50%',
              position: 'absolute',
              top: '-6px',
              right: '8px',
              border: '1px solid #b8860b',
            }}
          />
        </div>

        {/* Body */}
        <div
          style={{
            width: '38px',
            height: '28px',
            background: '#cc0000',
            position: 'absolute',
            top: '38px',
            left: '11px',
            border: '1px solid #990000',
            borderRadius: '2px',
            boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.2), inset 1px 1px 2px rgba(255,255,255,0.4)',
          }}
        >
          {/* Buttons */}
          <div
            style={{
              width: '4px',
              height: '4px',
              background: '#990000',
              borderRadius: '50%',
              position: 'absolute',
              top: '10px',
              left: '8px',
            }}
          />
          <div
            style={{
              width: '4px',
              height: '4px',
              background: '#990000',
              borderRadius: '50%',
              position: 'absolute',
              top: '10px',
              right: '8px',
            }}
          />
        </div>

        {/* Arms */}
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: '-14px',
            display: 'flex',
            gap: '52px',
          }}
        >
          {/* Left Arm */}
          <div
            style={{
              width: '12px',
              height: '8px',
              background: '#ffdb5d',
              borderRadius: '50%',
              border: '1px solid #d4af37',
            }}
          />
          {/* Right Arm */}
          <div
            style={{
              width: '12px',
              height: '8px',
              background: '#ffdb5d',
              borderRadius: '50%',
              border: '1px solid #d4af37',
            }}
          />
        </div>

        {/* Legs */}
        <div
          style={{
            position: 'absolute',
            top: '66px',
            left: '8px',
            display: 'flex',
            gap: '14px',
          }}
        >
          {/* Left Leg */}
          <div
            style={{
              width: '10px',
              height: '18px',
              background: '#ffdb5d',
              borderRadius: '2px',
              border: '1px solid #d4af37',
            }}
          />
          {/* Right Leg */}
          <div
            style={{
              width: '10px',
              height: '18px',
              background: '#ffdb5d',
              borderRadius: '2px',
              border: '1px solid #d4af37',
            }}
          />
        </div>

        {/* Feet */}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '4px',
            display: 'flex',
            gap: '20px',
          }}
        >
          {/* Left Foot */}
          <div
            style={{
              width: '14px',
              height: '6px',
              background: '#000',
              borderRadius: '1px',
            }}
          />
          {/* Right Foot */}
          <div
            style={{
              width: '14px',
              height: '6px',
              background: '#000',
              borderRadius: '1px',
            }}
          />
        </div>
      </div>

      {/* Click to cycle text */}
      <div
        style={{
          marginTop: '12px',
          fontSize: '10px',
          color: '#666',
          fontStyle: 'italic',
        }}
      >
        Click to see more tips
      </div>
    </div>
  );
};

export default LegoPerson;
