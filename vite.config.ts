import { defineConfig } from 'vite';
import Unocss from 'unocss/vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni(), Unocss()],
  build: {
    sourcemap: false,
  },
  resolve: {},
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg'],
  server: {
    // proxy: {
    //   '/proxy_geoserver': {
    //     target: 'http://47.92.103.246:9390',
    //     changeOrigin: true,
    //     rewrite: path => path.replace(/^\/proxy_geoserver/, '/proxy_geoserver'),
    //   },
    // },
  },
  // server: {
  // proxy: {
  //   "/proxy_api": {
  //     target: "https://v6lmtb9d-5173.inc1.devtunnels.ms/proxy_api",
  //     changeOrigin: true,
  //     rewrite: (path) => path.replace(/^\/proxy_api/, ""),
  //     // 方式4: 使用 headers 选项 (简单固定 cookie)
  //     headers: {
  //       Cookie:
  //         "tunnel_phishing_protection=fancy-horse-pvjs1rn.inc1; .Tunnels.Relay.WebForwarding.Cookies=CfDJ8Cs4yarcs6pKkdu0hlKHsZu2cYUjQQWeKn2amxoy51iVEFsmfSINwSPXbA0wPraQFxzu7_3jDz5cw8zDZuaGMtsYem8hKE5uEVwQVrcVfBjqPCWCnJ6Amb2bUL4FLyMrH57cZUmNVXaC8XBlHhRzRJf-MW7TEmZLpU6SnhrV5lDfHtw8nmD6JVA3urAonHKBoOVXVfDnuWjSFUDxJDDdoelq1wW2C3xeXZHG0ESETSQQuJHH2-FluSkCz2M9_oXUaLp49IkQ6IxwkhsojojHNaTuC27DdEHIV1L4hpw2iLc7jSxamK3SGZ03A4L9RnhUlU5d3AcBgGS5CpstDXqmalkVW-Vjunre0390VFsuP60ZcBm8z89ZgvQEkZIjGn6YOKgIdaMRkIOJd3V4yKNw0-rbcMcLas4ByPnmmF2zu3XQvOGJ2W4x45Fs056KmVeX-I3PL-l0Awnls39wpfNZvMeTUXAEL5NHtjIqRs1P0NxVlv5cvHZ-hveBMc7VeYqAf6W1cASnJXbxPzh-BUEU7M9D2TzFB5hm93J_PMQk5yxjhw-RIp8crH-AVGC4yXOGyYqdB-5ZKIPWdcD-PGKH1jloab2e-DmhxW08LnBzHk97zbXuCFnZ0ZxkCCYQVElGfO5NnXWYEfb1t0cwyBsKTRLfyNOX-C0BPZYlvfKPjGYCODV66r_5UqKkfXnXO7T-HJ_SkqocEW4-w3rMmCMUbtclVPf5BxUiWOdqJRSNzerAEmzKjIMXRt0j7tU01aajvFwAxJ_sXfZdJzDRtiFEg3L68-cj0UbW4glTnh9oGTQnMk8Z5qrdjcLUT4SUNSBHbq1LizwVvq3Xrjq244I7FtAz2M9721cjCE0pdmRYUqGLJsZr8JpEimrDuWnn4t2E4QnjmOkUV2DjjNFEUzffG3sYtS-7xfqRm55PKcaHwnO8d0uwvwpAzAy10UXB-gPOTcfbCtj7DTVT5Ga7ixK-iDfnjp60-8X6hlzRDyFKLhx4aEuYOmLlpVGi-ZR3K9KAXQPPiekwTfzorKTxbi9Q940CTIEK2PAvaEET1yH71QREj7Qz9gOb24qtraZuYIZtcnG44OjihzP2Vh0pmhTpwL3fDGm0YM16T6Vpelu3vvVSVWXB8w-UxMK0t2WOpq-AgnDlijl4OlJPmq9t39ig4-0FIoCV2gBfaDvJ4Vz9ZtGr2sSZSIC6FUVvTbzxeJrRLjKvRbscGg2cAZ85BqMgCFE-MFdTc1llSiD0nzcqf19pDeBMTDixncpnDLTjyCkNxdGqHLA1X1ybZBTaINZ7FDhp1JgxIzmPK_lTrlHGZCFJ0hG1VR_ASi6YkU7d6z1B6NKZ_g-sMfpuv5LjDFCtyJl-uvrhZeD1LI65IcqWViwauhhRm7-l8nXoYhInEvwpfLVBKPm4xb-sS7EQMK8_FOa8Np9ZkLEotLY_cLRQCCL8Z6mNoT1QDeCZZ7hKfgDNLy9Ae5Luw5xcEtrNAq6vem18_IhGNkzBscf9krsqVv32",
  //     },
  // configure: (proxy) => {
  //   proxy.on("proxyReq", (proxyReq) => {
  //     // 方式1: 添加固定的 cookie
  //     const existingCookie = proxyReq.getHeader("cookie");
  //     const newCookie = "sessionId=abc123; token=xyz789";

  //     if (existingCookie) {
  //       proxyReq.setHeader("cookie", `${existingCookie}; ${newCookie}`);
  //     } else {
  //       proxyReq.setHeader("cookie", newCookie);
  //     }

  //     // 方式2: 从环境变量读取 cookie
  //     // const envCookie = process.env.PROXY_COOKIE;
  //     // if (envCookie) {
  //     //   proxyReq.setHeader("cookie", envCookie);
  //     // }

  //     // 方式3: 动态生成 cookie
  //     // const timestamp = Date.now();
  //     // proxyReq.setHeader("cookie", `timestamp=${timestamp}`);
  //   });
  // },
  //   },
  // },
  // https: {
  //   key: fs.readFileSync(
  //     path.resolve(__dirname, "certs/localhost+2-key.pem")
  //   ),
  //   cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost+2.pem")),
  // },
  // },
});
