import { create } from 'zustand';

export const usePageStore = create((set, get) => ({
  pages: [
    { id: 1, content: '<h1>Page 1</h1><p>First page content</p>' },
    { id: 2, content: '<h1>Page 2</h1><p>Second page content</p>' },
    { id: 3, content: '<h1>Page 3</h1><p>Third page content</p>' },
  ],
  activePage: 0,
  zoom: 1,

  setPages: (pages) => set({ pages }),

  updatePageContent: (index, content) => {
    const pages = [...get().pages];
    if (pages[index]) {
      pages[index].content = content;
      set({ pages });
    }
  },

  addPage: (index, content = '<p></p>') => {
    const pages = [...get().pages];
    pages.splice(index + 1, 0, { id: Date.now(), content });
    set({ pages });
  },

  deletePage: (index) => {
    const pages = [...get().pages];
    if (pages.length > 1) {
      pages.splice(index, 1);
      set({ pages, activePage: Math.min(get().activePage, pages.length - 1) });
    }
  },

  reorderPages: (oldIndex, newIndex) => {
    console.log('Reordering from', oldIndex, 'to', newIndex);
    const pages = [...get().pages];
    console.log('Before:', pages.map(p => p.id));
    const [moved] = pages.splice(oldIndex, 1);
    pages.splice(newIndex, 0, moved);
    console.log('After:', pages.map(p => p.id));
    set({ pages, activePage: newIndex });
  },

  setActivePage: (index) => set({ activePage: index }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
}));
