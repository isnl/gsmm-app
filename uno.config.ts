import { defineConfig } from 'unocss';
import { presetUno, presetAttributify, presetIcons, transformerVariantGroup } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  shortcuts: [
    {
      fc: 'flex justify-center items-center',
      textEllipsis: 'overflow-hidden text-ellipsis whitespace-nowrap',
      shadowPrimary: 'shadow-[0_0_12px_1px_rgba(16,70,60,0.18)]',
      halfShadow: 'shadow-[0_0_6px_1px_rgba(16,70,60,0.18)]',
      borderBottom: 'b-b-1px b-b-#f2f2f2 b-b-solid',
      borderTop: 'b-t-1px b-t-#f2f2f2 b-t-solid',
      borderLeft: 'b-l-1px b-l-#f2f2f2 b-l-solid',
      borderRight: 'b-r-1px b-r-#f2f2f2 b-r-solid',
      textPrimary: 'text-#01bd8d',
      bgPrimary: 'bg-#01bd8d',
      borderPrimary: 'border-#01bd8d',
      labelColor: 'text-#666',
      valueColor: 'text-#333',
      borderColor: 'b-1px b-solid b-#f2f2f2',
    },
  ],
  transformers: [transformerVariantGroup()],
});
