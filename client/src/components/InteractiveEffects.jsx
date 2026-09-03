import { useEffect } from 'react';

export default function InteractiveEffects() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const onMove = (event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--pointer-x', `${event.clientX}px`);
        root.style.setProperty('--pointer-y', `${event.clientY}px`);
        raf = 0;
      });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      root.style.setProperty('--scroll-progress', `${progress}%`);
    };

    const onClick = (event) => {
      const target = event.target.closest('button, a, .quick-action, .nav-item, .icon-button');
      if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;

      const wave = document.createElement('span');
      wave.className = 'click-wave';
      wave.style.left = `${event.clientX}px`;
      wave.style.top = `${event.clientY}px`;
      document.body.appendChild(wave);
      window.setTimeout(() => wave.remove(), 620);
    };

    const revealTargets = document.querySelectorAll('.panel, .stat-card, .mini-stat, .report-card, .member-card, .notification-row, .approval-row, .info-banner');
    revealTargets.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index * 35, 240)}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.08 });
    revealTargets.forEach((element) => observer.observe(element));

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);
    onScroll();

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="cursor-spotlight" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true" />
    </>
  );
}
