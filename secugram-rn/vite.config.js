import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { transformAsync } from '@babel/core';

// Plugin pre-transform : convertit JSX dans les fichiers .js avant que OXC ne les parse
const jsxInJsPlugin = {
  name: 'jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (id.includes('node_modules')) return null;
    if (!id.endsWith('.js')) return null;
    const result = await transformAsync(code, {
      filename: id,
      sourceType: 'module',
      configFile: false,
      babelrc: false,
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
      sourceMaps: true,
    });
    return { code: result.code, map: result.map };
  },
};

export default defineConfig({
  plugins: [jsxInJsPlugin, react()],
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
      'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(
        __dirname, 'src/stubs/codegenNativeComponent.js'
      ),
      'react-native-safe-area-context': path.resolve(
        __dirname, 'src/stubs/safe-area-context.js'
      ),
      'react-native-image-picker': path.resolve(
        __dirname, 'src/stubs/image-picker.js'
      ),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname, 'src/stubs/async-storage.js'
      ),
    },
    extensions: ['.web.js', '.js', '.web.ts', '.ts', '.web.tsx', '.tsx'],
  },
  optimizeDeps: {
    exclude: [
      'react-native-web',
      'react-native-safe-area-context',
      'react-native-image-picker',
      '@react-native-async-storage/async-storage',
    ],
  },
});
