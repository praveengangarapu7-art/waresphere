import React from 'react'
import styles from './BrandPanel.module.css'

export const BrandPanel: React.FC = () => {
  return (
    <div className={styles.panel}>
      {/* Abstract background grid and network nodes SVG */}
      <svg className={styles.gridSvg} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" fill="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        
        {/* Fill Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Isometric warehouse rack line stubs */}
        <path d="M50 150 L200 70 L350 150 L200 230 Z" stroke="rgba(245, 166, 35, 0.25)" strokeWidth="1.5" />
        <path d="M50 300 L200 220 L350 300 L200 380 Z" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <path d="M50 450 L200 370 L350 450 L200 530 Z" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
        
        {/* Vertical lines connecting layers */}
        <line x1="50" y1="150" x2="50" y2="450" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        <line x1="200" y1="70" x2="200" y2="370" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        <line x1="350" y1="150" x2="350" y2="450" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        
        {/* Key nodes / bin highlights — subtle ambient pulse */}
        <circle cx="200" cy="70" r="4" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;5.5;4" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="125" cy="110" r="3" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4.1s" begin="0.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="3;4.5;3" dur="4.1s" begin="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="275" cy="110" r="3" fill="rgba(255, 255, 255, 0.5)">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="5s" begin="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="220" r="4" fill="rgba(255, 255, 255, 0.5)">
          <animate attributeName="opacity" values="0.4;0.85;0.4" dur="3.8s" begin="0.4s" repeatCount="indefinite" />
          <animate attributeName="r" values="4;5;4" dur="3.8s" begin="0.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="125" cy="260" r="3" fill="var(--color-accent)">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="4.6s" begin="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="WareSphere" className={styles.logoImg} />
        </div>
        
        <div className={styles.taglineArea}>
          <h1 className={styles.tagline}>
            Every SKU.<br />
            Every Bin.<br />
            Every Second.
          </h1>
          <p className={styles.subtext}>
            AI-augmented warehouse execution system designed for high-throughput, multi-facility logistics operations across India.
          </p>
        </div>
        
        <div className={styles.footer}>
          <span>Precision Inventory Management</span>
          <span>v1.0.0-Prototype</span>
        </div>
      </div>
    </div>
  )
}
