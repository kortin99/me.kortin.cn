import {
  defineConfig,
  presetIcons,
  presetUno,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    { 'i-logo': 'i-logos-astro w-6em h-6em transform transition-800' },
  ],
  transformers: [
    transformerDirectives(),
  ],
  presets: [
    presetUno(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  rules: [
    ['animation-delay-0', { 'animation-delay': '0ms' }],
    ['animation-delay-150', { 'animation-delay': '150ms' }],
    ['animation-delay-300', { 'animation-delay': '300ms' }],
  ],
})