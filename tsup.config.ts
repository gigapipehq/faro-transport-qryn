import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  tsconfig: './tsconfig.json',
  format: ['esm', 'cjs'],
  target: 'esnext',
  sourcemap: true,
  clean: true,
  dts: true,
})
