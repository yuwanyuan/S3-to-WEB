import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { AwsClient } from 'aws4fetch';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const BUCKET_NAME = process.env.BUCKET_NAME || 'free';
  const AWS_REGION = process.env.AWS_REGION || 'auto';
  const CUSTOM_AUTH_SECRET = process.env.CUSTOM_AUTH_SECRET;
  const S3_ENDPOINT = process.env.S3_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com

  const aws = new AwsClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock-secret',
    region: AWS_REGION,
    service: 's3'
  });

  const parser = new XMLParser();

  app.use(express.json());

  // Middleware for Custom Auth
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!CUSTOM_AUTH_SECRET) return next();
    
    const authHeader = req.headers['x-custom-auth'];
    if (authHeader !== CUSTOM_AUTH_SECRET) {
      return res.status(401).json({ error: '未授权：请检查 Auth Secret' });
    }
    next();
  };

  // Helper to get clean S3 URL
  const getS3Url = (path: string = '') => {
    let baseUrl = '';
    if (S3_ENDPOINT) {
      baseUrl = S3_ENDPOINT.replace(/\/$/, '');
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }
      // 如果端点已经包含了存储桶名 (如 R2 的 https://.../free)
      // 则不再重复添加存储桶名
      if (baseUrl.toLowerCase().endsWith(`/${BUCKET_NAME.toLowerCase()}`)) {
        return path ? `${baseUrl}/${path}` : `${baseUrl}/`;
      }
      return path ? `${baseUrl}/${BUCKET_NAME}/${path}` : `${baseUrl}/${BUCKET_NAME}/`;
    }
    // 默认 AWS S3 格式
    baseUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
    return path ? `${baseUrl}/${path}` : `${baseUrl}/`;
  };

  // 辅助函数：将 S3 错误转换为用户友好的提示信息
  const translateS3Error = (status: number, text: string) => {
    let errorCode = '';
    try {
      const jsonObj = parser.parse(text);
      if (jsonObj.Error && jsonObj.Error.Code) {
        errorCode = jsonObj.Error.Code;
      }
    } catch (e) {}

    // 根据错误代码或状态码返回对应的中文提示
    if (errorCode === 'NoSuchBucket' || (status === 404 && text.includes('NoSuchBucket'))) return '存储桶不存在，请检查 BUCKET_NAME 配置。';
    if (errorCode === 'AccessDenied' || status === 403) return '权限不足或密钥错误，请检查 Access Key 和 Secret Key。';
    if (errorCode === 'InvalidAccessKeyId') return 'Access Key 无效，请检查配置。';
    if (errorCode === 'SignatureDoesNotMatch') return '签名不匹配 (Secret Key 错误)，请检查配置。';
    if (errorCode === 'NoSuchKey' || status === 404) return '指定的文件不存在。';
    if (errorCode === 'MethodNotAllowed' || status === 405) return '方法不允许，可能缺少写入权限。';
    
    return `S3 操作失败 (${status}): ${errorCode || '未知错误'}`;
  };

  // ==========================================
  // API 路由定义
  // ==========================================
  
  // 1. 获取对象列表 (List Objects)
  app.get('/api/s3/list', authMiddleware, async (req, res) => {
    const hasConfig = process.env.AWS_ACCESS_KEY_ID && 
                     process.env.AWS_ACCESS_KEY_ID !== 'mock-key' &&
                     process.env.AWS_SECRET_ACCESS_KEY;

    if (!hasConfig) {
      return res.json([
        { key: '说明文档/如何配置.pdf', size: 1024 * 15, lastModified: new Date().toISOString() },
        { key: '演示数据/示例图片.jpg', size: 1024 * 250, lastModified: new Date().toISOString() },
        { key: '系统文件/config.json', size: 512, lastModified: new Date().toISOString() },
      ]);
    }

    const s3Url = getS3Url() + '?list-type=2';
    console.log(`[S3 Request] Listing objects from: ${s3Url}`);
    
    try {
      const response = await aws.fetch(s3Url, { method: 'GET' });
      const text = await response.text();
      
      if (!response.ok) {
        const errorMsg = translateS3Error(response.status, text);
        throw new Error(errorMsg);
      }

      // 解析 S3 XML 响应
      const jsonObj = parser.parse(text);
      const contents = jsonObj.ListBucketResult?.Contents;
      
      // 统一格式化为前端需要的 JSON 数组
      const objects = (Array.isArray(contents) ? contents : (contents ? [contents] : [])).map((item: any) => ({
        key: item.Key,
        size: parseInt(item.Size) || 0,
        lastModified: item.LastModified
      }));

      res.json(objects);
    } catch (error: any) {
      console.error(`[S3 Error] ${error.message}`);
      res.status(500).json({ error: `S3 连接失败: ${error.message}` });
    }
  });

  // 2. 扩展操作：创建文件夹、复制、移动
  
  // 创建文件夹 (在 S3 中，文件夹实际上是一个以 '/' 结尾的 0 字节对象)
  app.post('/api/s3/action/folder', authMiddleware, async (req, res) => {
    let { folderName } = req.body;
    if (!folderName) return res.status(400).json({ error: '缺少文件夹名称' });
    
    // 确保以 '/' 结尾
    if (!folderName.endsWith('/')) folderName += '/';
    
    const s3Url = getS3Url(folderName);
    try {
      // 发送一个空的 PUT 请求来创建文件夹对象
      const response = await aws.fetch(s3Url, { method: 'PUT', body: '' });
      if (!response.ok) throw new Error(translateS3Error(response.status, await response.text()));
      res.json({ success: true, message: '文件夹创建成功' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 复制文件
  app.post('/api/s3/action/copy', authMiddleware, async (req, res) => {
    const { sourceKey, destinationKey } = req.body;
    if (!sourceKey || !destinationKey) return res.status(400).json({ error: '缺少源路径或目标路径' });
    
    const s3Url = getS3Url(destinationKey);
    try {
      // S3 复制操作通过 PUT 请求和 x-amz-copy-source 请求头实现
      const response = await aws.fetch(s3Url, {
        method: 'PUT',
        headers: {
          // 必须包含存储桶名称和编码后的源对象键
          'x-amz-copy-source': `/${BUCKET_NAME}/${encodeURI(sourceKey)}`
        }
      });
      if (!response.ok) throw new Error(translateS3Error(response.status, await response.text()));
      res.json({ success: true, message: '文件复制成功' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 移动文件 (复制 + 删除)
  app.post('/api/s3/action/move', authMiddleware, async (req, res) => {
    const { sourceKey, destinationKey } = req.body;
    if (!sourceKey || !destinationKey) return res.status(400).json({ error: '缺少源路径或目标路径' });
    
    try {
      // 第一步：复制对象到新位置
      const copyUrl = getS3Url(destinationKey);
      const copyResponse = await aws.fetch(copyUrl, {
        method: 'PUT',
        headers: {
          'x-amz-copy-source': `/${BUCKET_NAME}/${encodeURI(sourceKey)}`
        }
      });
      if (!copyResponse.ok) throw new Error(`复制失败: ${translateS3Error(copyResponse.status, await copyResponse.text())}`);

      // 第二步：删除原对象
      const deleteUrl = getS3Url(sourceKey);
      const deleteResponse = await aws.fetch(deleteUrl, { method: 'DELETE' });
      if (!deleteResponse.ok) throw new Error(`删除原文件失败: ${translateS3Error(deleteResponse.status, await deleteResponse.text())}`);

      res.json({ success: true, message: '文件移动成功' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. 代理所有的 S3 读写删请求 (Proxy all other S3 requests)
  app.all('/api/s3/proxy/*', authMiddleware, async (req, res) => {
    const pathParam = req.params[0];
    const s3Url = getS3Url(pathParam);
    
    const method = req.method;
    const headers: Record<string, string> = {};
    
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }

    try {
      // For PUT requests, we stream the body
      const fetchOptions: any = {
        method,
        headers,
      };

      if (method === 'PUT' || method === 'POST') {
        // Express doesn't easily give us a ReadableStream for the body in the same way Fetch expects
        // but we can pass the request object if we handle it carefully or use a buffer for smaller files.
        // For a true "Worker" style proxy, we'd use web streams.
        // Here we'll use a buffer for simplicity in this environment.
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        fetchOptions.body = Buffer.concat(chunks);
      }

      const s3Response = await aws.fetch(s3Url, fetchOptions);
      
      if (!s3Response.ok) {
        const text = await s3Response.text();
        const errorMsg = translateS3Error(s3Response.status, text);
        return res.status(s3Response.status).json({ error: errorMsg, details: text.slice(0, 200) });
      }

      // Forward headers
      const responseHeaders = s3Response.headers;
      responseHeaders.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.set(key, value);
        }
      });

      res.status(s3Response.status);
      
      if (s3Response.body) {
        // Stream the response back
        const reader = s3Response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        res.end();
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
