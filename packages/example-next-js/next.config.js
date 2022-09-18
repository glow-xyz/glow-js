/** @type {import('next').NextConfig} */

const withTM = require("next-transpile-modules")(["@glow-xyz/glow-id"]);

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withTM(nextConfig);
