import { useUIStore, useDocumentStore, useEditorStore } from '@/store';
import { Modal, Button, Stack } from '@/components/ui';
import { format } from 'date-fns';

export function VersionHistoryDialog() {
  const { closeDialog, toast } = useUIStore();
  const { versions } = useDocumentStore();
  const { editor }   = useEditorStore();

  const restore = (v) => {
    editor?.commands.setContent(v.snapshot, true);
    toast(`Restored ${v.label}`, 'success');
    closeDialog('versionHistory');
  };

  return (
    <Modal title="Version History" onClose={() => closeDialog('versionHistory')} width={440}>
      {versions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', fontFamily:'var(--font-ui)', fontSize:13 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏱</div>
          <div>No saved versions yet.</div>
          <div style={{ fontSize:11, marginTop:6 }}>Versions auto-save every 5 minutes.</div>
        </div>
      ) : (
        <Stack gap={8}>
          {versions.map((v) => (
            <div key={v.id} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', background:'var(--bg-elevated)',
              border:'1px solid var(--border)', borderRadius:'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontFamily:'var(--font-ui)', fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:2 }}>{v.label}</div>
                <div style={{ fontFamily:'var(--font-ui)', fontSize:11, color:'var(--text-muted)' }}>
                  {format(new Date(v.savedAt), 'MMM d, yyyy · h:mm a')}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => restore(v)}>Restore</Button>
            </div>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
