/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Externalizar ssh2 completamente en el cliente
      config.externals = config.externals || [];
      config.externals.push('ssh2');
      
      // Configurar fallbacks para módulos de Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        'ssh2': false,
      };
      
      // Ignorar módulos nativos (.node)
      config.module.rules.push({
        test: /\.node$/,
        use: 'empty-loader'
      });
    }
    
    // Marcar ssh2 como external en todas partes
    config.externals = [...(config.externals || []), 'ssh2'];
    
    config.module.exprContextCritical = false;
    
    return config;
  },
}

module.exports = nextConfig
