import React from 'react'

export default function CombinedAvatar({ participants = [], size = 44 }) {
    const imgs = (participants || []).slice(0, 3).map(p => p?.avatarUrl || 'https://via.placeholder.com/44')
    const containerStyle = { width: size, height: size, position: 'relative' }
    const overlap = Math.floor(size * 0.28)
    return (
        <div style={containerStyle}>
            {imgs.map((src, idx) => {
                const style = {
                    width: Math.floor(size * 0.62),
                    height: Math.floor(size * 0.62),
                    borderRadius: '50%',
                    objectFit: 'cover',
                    position: 'absolute',
                    left: idx * overlap,
                    top: idx === 0 ? 0 : Math.floor(size * 0.06),
                    border: '2px solid #0b1220',
                    background: '#cbd5e1'
                }
                return <img key={idx} src={src} alt={`a${idx}`} style={style} />
            })}
        </div>
    )
}
