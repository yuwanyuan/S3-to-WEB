import { AwsClient } from 'aws4fetch';

/**
 * Cloudflare Worker 部署代码
 * 
 * 部署步骤：
 * 1. 在 Cloudflare 控制台创建新的 Worker
 * 2. 设置环境变量：
 *    - S3_ENDPOINT: 您的 S3 兼容端点 (例如 R2 的端点)
 *    - AWS_ACCESS_KEY_ID: 访问密钥
 *    - AWS_SECRET_ACCESS_KEY: 私钥
 *    - AWS_REGION: 区域 (R2 通常设为 auto)
 *    - BUCKET_NAME: 存储桶名称
 *    - CUSTOM_AUTH_SECRET: 自定义鉴权密钥 (与前端一致)
 */

export default {
  async fetch(request, env, ctx) {
    const aws = new AwsClient({
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION || 'auto',
    });

    const url = new URL(request.url);
    const authHeader = request.headers.get('X-Custom-Auth');

    // 鉴权检查
    if (env.CUSTOM_AUTH_SECRET && authHeader !== env.CUSTOM_AUTH_SECRET) {
      return new Response(JSON.stringify({ error: '未授权' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 处理 API 请求
    if (url.pathname === '/api/s3/list') {
      const s3Url = env.S3_ENDPOINT 
        ? `${env.S3_ENDPOINT.replace(/\/$/, '')}/?list-type=2`
        : `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/?list-type=2`;
      
      const response = await aws.fetch(s3Url, { method: 'GET' });
      return response;
    }

    if (url.pathname.startsWith('/api/s3/proxy/')) {
      const pathParam = url.pathname.replace('/api/s3/proxy/', '');
      const s3Url = env.S3_ENDPOINT 
        ? `${env.S3_ENDPOINT.replace(/\/$/, '')}/${pathParam}`
        : `https://${env.BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${pathParam}`;
      
      const method = request.method;
      const fetchOptions = {
        method,
        headers: {},
        body: request.body
      };

      if (request.headers.has('Content-Type')) {
        fetchOptions.headers['Content-Type'] = request.headers.get('Content-Type');
      }

      const response = await aws.fetch(s3Url, fetchOptions);
      return response;
    }

    // 默认返回 404
    return new Response('Not Found', { status: 404 });
  }
};
