import { useState } from 'react';
import { useUIStore, useEditorStore } from '@/store';
import { Modal, Button, Input, Label, Stack } from '@/components/ui';

export function InsertLinkDialog() {
  const { closeDialog } = useUIStore();
  const { editor } = useEditorStore();
  const [href, setHref] = useState('https://');
  const [text, setText] = useState('');

  const insert = () => {
    if (!href.trim()) return;
    const chain = editor?.chain().focus();
    if (text.trim()) {
      chain?.insertContent(`<a href="${href}">${text}</a>`).run();
    } else {
      chain?.setLink({ href: href.trim() }).run();
    }
    closeDialog('insertLink');
  };

  const remove = () => { editor?.chain().focus().unsetLink().run(); closeDialog('insertLink'); };

  return (
    <Modal title="Insert Hyperlink" onClose={() => closeDialog('insertLink')} width={420}>
      <Stack gap={14}>
        <div><Label>URL</Label><Input value={href} onChange={setHref} placeholder="https://example.com" autoFocus /></div>
        <div><Label>Display Text (optional)</Label><Input value={text} onChange={setText} placeholder="Leave blank to use selection" /></div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Button variant="danger" size="sm" onClick={remove}>Remove Link</Button>
          <Button variant="subtle" onClick={() => closeDialog('insertLink')}>Cancel</Button>
          <Button variant="primary" onClick={insert} disabled={!href.trim() || href === 'https://'}>✓ Insert</Button>
        </div>
      </Stack>
    </Modal>
  );
}
