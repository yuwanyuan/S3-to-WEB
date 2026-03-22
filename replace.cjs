const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { from: /bg-\[#E4E3E0\]/g, to: 'bg-bg-main' },
  { from: /text-\[#141414\]/g, to: 'text-text-main' },
  { from: /border-\[#141414\]/g, to: 'border-border-main' },
  { from: /bg-white/g, to: 'bg-bg-card' },
  { from: /bg-\[#141414\]/g, to: 'bg-bg-invert' },
  { from: /text-\[#E4E3E0\]/g, to: 'text-text-invert' },
  { from: /hover:bg-\[#141414\]/g, to: 'hover:bg-bg-hover' },
  { from: /hover:text-\[#E4E3E0\]/g, to: 'hover:text-text-invert' },
  { from: /hover:bg-white/g, to: 'hover:bg-bg-card' },
  { from: /bg-\[#141414\]\/10/g, to: 'bg-bg-muted' },
  { from: /bg-\[#141414\]\/20/g, to: 'bg-bg-invert/20' },
  { from: /border-\[#141414\]\/10/g, to: 'border-border-main/10' },
  { from: /border-\[#141414\]\/20/g, to: 'border-border-main/20' },
  { from: /shadow-\[8px_8px_0px_0px_rgba\(20,20,20,1\)\]/g, to: 'shadow-[8px_8px_0px_0px_var(--color-border-main)]' },
  { from: /selection:bg-\[#141414\]/g, to: 'selection:bg-bg-invert' },
  { from: /selection:text-\[#E4E3E0\]/g, to: 'selection:text-text-invert' },
  { from: /bg-black\/5/g, to: 'bg-bg-muted' }
];

replacements.forEach(r => {
  code = code.replace(r.from, r.to);
});

fs.writeFileSync('src/App.tsx', code);
