import { useState, useRef, useEffect } from 'react';
import { useUIStore, useEditorStore } from '@/store';
import { Modal, Button, Input, Label, Stack, Select } from '@/components/ui';

const CHART_TYPES = [
  { value: 'bar',  label: '▊ Bar Chart'  },
  { value: 'line', label: '↗ Line Chart' },
  { value: 'pie',  label: '◕ Pie Chart'  },
];

const DEFAULT_DATA = {
  bar:  { labels: ['Q1','Q2','Q3','Q4'], values: [42,68,55,91] },
  line: { labels: ['Jan','Feb','Mar','Apr','May'], values: [30,45,38,60,52] },
  pie:  { labels: ['Alpha','Beta','Gamma','Delta'], values: [35,25,20,20] },
};

export function InsertChartDialog() {
  const { closeDialog, toast } = useUIStore();
  const { editor } = useEditorStore();
  const canvasRef  = useRef();
  const chartRef   = useRef();

  const [type,   setType]   = useState('bar');
  const [title,  setTitle]  = useState('My Chart');
  const [data,   setData]   = useState(DEFAULT_DATA.bar);
  const [color,  setColor]  = useState('#d4af37');

  // Re-draw chart on change
  useEffect(() => {
    const draw = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d');
      chartRef.current = new Chart(ctx, {
        type,
        data: {
          labels: data.labels,
          datasets: [{
            label: title,
            data: data.values,
            backgroundColor: type === 'pie'
              ? ['#d4af37','#b8952d','#edd870','#7a5f1a','#f5e6a3']
              : `${color}99`,
            borderColor: color,
            borderWidth: 2,
            borderRadius: type === 'bar' ? 4 : 0,
            tension: 0.4,
            fill: type === 'line',
          }],
        },
        options: {
          responsive: false,
          plugins: {
            legend: { labels: { color: '#ece8dc', font: { family: 'Cinzel, serif', size: 11 } } },
          },
          scales: type !== 'pie' ? {
            x: { ticks: { color: '#888' }, grid: { color: '#2a2a2a' } },
            y: { ticks: { color: '#888' }, grid: { color: '#2a2a2a' } },
          } : undefined,
        },
      });
    };
    draw();
    return () => { chartRef.current?.destroy(); };
  }, [type, title, data, color]);

  const updateLabels = (raw) => {
    const labels = raw.split(',').map((s) => s.trim()).filter(Boolean);
    setData((d) => ({ ...d, labels }));
  };

  const updateValues = (raw) => {
    const values = raw.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    setData((d) => ({ ...d, values }));
  };

  const handleTypeChange = (t) => {
    setType(t);
    setData(DEFAULT_DATA[t]);
  };

  const insertChart = () => {
    if (!canvasRef.current) return;
    const img = canvasRef.current.toDataURL('image/png');
    editor?.chain().focus().setImage({ src: img, alt: `Chart: ${title}` }).run();
    toast('Chart inserted!', 'success');
    closeDialog('insertChart');
  };

  return (
    <Modal title="Insert Chart" onClose={() => closeDialog('insertChart')} width={620}>
      <div style={{ display:'flex', gap:20 }}>
        {/* Controls */}
        <div style={{ flex:'0 0 220px', display:'flex', flexDirection:'column', gap:12 }}>
          <div><Label>Chart Type</Label><Select value={type} onChange={handleTypeChange} options={CHART_TYPES} width="100%" /></div>
          <div><Label>Title</Label><Input value={title} onChange={setTitle} placeholder="Chart title" /></div>
          <div><Label>Labels (comma-separated)</Label><Input value={data.labels.join(', ')} onChange={updateLabels} placeholder="A, B, C" /></div>
          <div><Label>Values (comma-separated)</Label><Input value={data.values.join(', ')} onChange={updateValues} placeholder="10, 20, 30" /></div>
          <div>
            <Label>Accent Color</Label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                style={{ width:36, height:28, border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', cursor:'pointer', padding:2, background:'transparent' }} />
              <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-ui)' }}>{color}</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:'auto' }}>
            <Button variant="primary" onClick={insertChart}>✓ Insert Chart</Button>
            <Button variant="subtle"  onClick={() => closeDialog('insertChart')}>Cancel</Button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex:1, background:'var(--bg-elevated)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
          <canvas ref={canvasRef} width={340} height={260} style={{ borderRadius:'var(--radius-sm)' }} />
        </div>
      </div>
    </Modal>
  );
}
