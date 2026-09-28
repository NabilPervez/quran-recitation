import type {NextConfig} from 'next';

// Fully client-side app: export static files for Netlify.
const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
