import { useRef, useEffect } from 'react';
import { usePageStore } from '@/store/usePageStore';
import { Page } from './Page';

export function PageEditor() {
  const pages = usePageStore((s) => s.pages);
  const activePage = usePageStore((s) => s.activePage);
  const zoom = usePageStore((s) => s.zoom);
  const updatePageContent = usePageStore((s) => s.updatePageContent);
  const addPage = usePageStore((s) => s.addPage);
  const setActivePage = usePageStore((s) => s.setActivePage);
  const scrollRef = useRef(null);

  const handleInput = (index, content) => {
    updatePageContent(index, content);
  };

  const handleOverflow = (index) => {
    const pageEl = document.querySelectorAll('.page-content')[index];
    if (!pageEl) return;

    const fullContent = pageEl.innerHTML;
    const splitPoint = Math.floor(fullContent.length * 0.7);
    
    const currentContent = fullContent.slice(0, splitPoint);
    const overflowContent = fullContent.slice(splitPoint);

    updatePageContent(index, currentContent);
    addPage(index, overflowContent);
  };

  const handlePageClick = (index) => {
    setActivePage(index);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const pageElements = el.querySelectorAll('.page');
      const scrollTop = el.scrollTop;
      
      let currentPage = 0;
      pageElements.forEach((pageEl, i) => {
        const rect = pageEl.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 100) {
          currentPage = i;
        }
      });

      setActivePage(currentPage);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [setActivePage]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        background: 'var(--bg-app)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          padding: '40px 20px',
          transition: 'transform 0.2s ease',
        }}
      >
        {pages.map((page, index) => (
          <Page
            key={page.id}
            index={index}
            content={page.content}
            isActive={activePage === index}
            onInput={handleInput}
            onOverflow={handleOverflow}
            onClick={handlePageClick}
          />
        ))}
      </div>
    </div>
  );
}
