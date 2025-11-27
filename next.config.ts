import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'dbnqlgqywlzpzwesrafm.supabase.co',
      'ui-avatars.com'
    ],
  },
};

export default nextConfig;
