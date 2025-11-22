import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Production build optimizations
        minify: 'esbuild',
        target: 'es2020',
        cssMinify: true,

        // Code splitting for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom'],
                    'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                },
                // Optimized chunk file names
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
            },
        },

        // Increase chunk size warning limit (500kb is reasonable for modern apps)
        chunkSizeWarningLimit: 500,

        // Enable source maps for production debugging (can be disabled for smaller bundles)
        sourcemap: false,

        // Report compressed size
        reportCompressedSize: true,

        // Enable CSS code splitting
        cssCodeSplit: true,
    },

    // Performance optimizations for development
    server: {
        // Enable HMR for faster development
        hmr: true,
        // Optimize dependency pre-bundling
        fs: {
            strict: true,
        },
    },

    // Dependency optimization
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@supabase/supabase-js',
            'lucide-react',
        ],
        exclude: [],
    },
})
