"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  useEffect(() => {
    // Import header handler for burger menu
    import('@/js/header-handler').catch(() => {
      console.warn('Header handler not loaded');
    });
  }, []);

  return (
    <header className="header">
      <div className="header-inner container">
        <div className="logo">
          <Link href="/">
            <Image src="/logocleanstay.webp" alt="CleanStay Logo" width={150} height={40} priority />
          </Link>
        </div>
        <div className="header-nav">
          <nav className="nav">
            <ul className="nav-list">
              <li><Link href="/uklid-domacnosti">Úklid domácností</Link></li>
              <li><Link href="/uklid-firem">Pro firmy</Link></li>
              <li><Link href="/airbnb">Airbnb</Link></li>
              <li><Link href="/cenik">Ceník</Link></li>
            </ul>
          </nav>
          <a className="contact-link" href="#kontakt">
            Objednát
          </a>
        </div>
        <button
          id="burgerBtn"
          className="burger-menu-btn"
          aria-label="Open menu"
          type="button"
        >
          <svg className="burger-menu-btn-icon" width="32" height="32">
            <use href="/sprite.svg#burger"></use>
          </svg>
        </button>
      </div>
    </header>
  );
}
