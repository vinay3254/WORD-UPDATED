# EtherX Word — Frontend Architecture

## Overview

EtherX Word is a Microsoft Word-like document editor built with React + Vite.
The design language is **premium dark/light: Gold (#d4af37) on Black/White**
using `Cinzel` (UI / display), `Crimson Pro` (document body), and `JetBrains Mono` (code).

---

## Folder Structure

```
frontend/src/
│
├── main.jsx                    # Entry — injects theme, renders App
├── App.jsx                     # Router (/, /doc/:id, /doc/new)
│
├── theme/
│   ├── tokens.js               # applyTheme() — injects all CSS vars
│   └── global.css              # Base reset, ProseMirror styles, animations
│
├── store/
│   └── index.js                # Zustand stores: document / UI / editor
│
├── hooks/
│   ├── useTheme.js             # Applies theme vars + localStorage persistence
│   ├── useEditorSetup.js       # Tiptap editor factory with all extensions
│   ├── useAutoSave.js          # Debounced auto-save + Ctrl+S + version snapshots
│   └── useKeyboardShortcuts.js # Global keyboard bindings
│
├── services/
│   ├── api.js                  # documentApi / uploadApi / exportApi / templateApi
│   ├── websocket.js            # CollabSocket class — WebSocket with auto-reconnect
│   └── export.js               # exportToHtml / exportToPdf / exportToDocx
│
├── pages/
│   ├── HomePage.jsx            # Document launcher: templates + recent docs
│   └── EditorPage.jsx          # Main editor shell
│
├── components/
│   │
│   ├── ui/
│   │   ├── index.jsx           # Button, Divider, Tooltip, Select, Input,
│   │   │                       # Modal, Label, Stack, Badge, NumberInput, ColorSwatch
│   │   ├── Toast.jsx           # ToastContainer + Toast
│   │   └── EtherXLogo.jsx      # SVG shield logo component
│   │
│   ├── editor/
│   │   ├── TitleBar.jsx        # Document title (editable), save status, controls
│   │   ├── EditorCanvas.jsx    # A4 page(s) + Tiptap EditorContent
│   │   └── StatusBar.jsx       # Word count, zoom slider, page info
│   │
│   ├── toolbar/
│   │   ├── Ribbon.jsx          # Tab strip + collapsible content row
│   │   ├── RibbonGroup.jsx     # Labelled group wrapper
│   │   └── tabs/
│   │       ├── HomeTab.jsx     # Clipboard, Font, Paragraph, Styles, Editing
│   │       ├── InsertTab.jsx   # Tables, Illustrations, Links, Text, Comments
│   │       └── OtherTabs.jsx   # LayoutTab, ReviewTab, ViewTab
│   │
│   ├── sidebar/
│   │   └── PageSidebar.jsx     # Page thumbnail navigator
│   │
│   └── dialogs/
│       ├── DialogManager.jsx   # Mounts all dialogs based on store.dialogs state
│       ├── InsertImageDialog.jsx
│       ├── InsertTableDialog.jsx  # 8×8 visual grid picker
│       ├── InsertLinkDialog.jsx
│       ├── InsertChartDialog.jsx  # Bar/Line/Pie with live canvas preview
│       ├── InsertShapeDialog.jsx  # SVG shape library
│       ├── InsertSymbolDialog.jsx # 200+ symbols by category
│       ├── FindReplaceDialog.jsx
│       ├── DrawingDialog.jsx      # Freehand pen / highlighter / eraser
│       ├── ExportDialog.jsx       # PDF / DOCX / HTML
│       ├── ShareDialog.jsx
│       └── VersionHistoryDialog.jsx
```

---

## State Architecture

Three separate Zustand stores:

| Store            | Responsibility                                      |
|------------------|-----------------------------------------------------|
| `useDocumentStore` | Document content, title, save state, versions, stats |
| `useUIStore`       | Theme, zoom, dialogs, toasts, layout toggles         |
| `useEditorStore`   | Tiptap editor instance, font settings, spell check   |

Stores are importable anywhere — no prop drilling.

---

## Tiptap Extensions Used

StarterKit, Underline, TextAlign, TextStyle, Color, Highlight,
Link, Image, Table/Row/Cell/Header, TaskList/Item,
CharacterCount, Placeholder, Typography, Focus,
Subscript, Superscript, FontFamily

---

## Theme System

```
tokens.js: applyTheme('dark'|'light')
  → sets 40+ CSS custom properties on :root
  → read via var(--gold), var(--bg-surface), etc.
```

All components use CSS vars — switching theme is a single function call.

---

## Adding New Features

**New dialog:**
1. Create `src/components/dialogs/YourDialog.jsx`
2. Add key to `dialogs: {}` in `useUIStore`
3. Import + mount in `DialogManager.jsx`
4. Trigger via `openDialog('yourKey')` from any component

**New ribbon tab:**
1. Create `src/components/toolbar/tabs/YourTab.jsx`
2. Add `{ id, label }` to TABS array in `Ribbon.jsx`
3. Add to TAB_CONTENT map

**New service:**
1. Add function to `services/api.js`
2. Call from hooks or components

---

## npm Packages

```
Core:
  react, react-dom, react-router-dom
  @tiptap/react + all extensions
  zustand

Export:
  jspdf, html2canvas, docx, file-saver

Charts:
  chart.js, react-chartjs-2

Utils:
  date-fns, uuid
```

---

## Backend API Contract (Node.js)

```
GET    /api/documents
GET    /api/documents/:id
POST   /api/documents
PUT    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/versions
POST   /api/documents/:id/versions/:vid/restore
POST   /api/documents/:id/share
POST   /api/upload/image  (multipart)
GET    /api/export/:id/pdf|docx|html
GET    /api/templates
WS     /ws/doc/:id         (collaboration)
```

---

## Running

```bash
cd frontend
npm install
npm run dev      # → http://localhost:3000
```
