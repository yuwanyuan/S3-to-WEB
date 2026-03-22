import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, 
  HardDrive, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File, 
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  MoreVertical,
  FolderPlus,
  Copy,
  MoveRight,
  Folder,
  Link,
  Check,
  Moon,
  Sun,
  Languages,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// 类型定义
// ==========================================
interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

type ModalType = 'delete' | 'folder' | 'copy' | 'move' | 'rename' | null;

interface ModalConfig {
  type: ModalType;
  targetKey?: string;
}

export default function App() {
  // ==========================================
  // 状态管理
  // ==========================================
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [authSecret, setAuthSecret] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true); // 默认假设授权通过
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件夹导航状态
  const [currentPath, setCurrentPath] = useState('');

  // 自定义外部域名状态
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('s3_custom_domain') || '');

  useEffect(() => {
    localStorage.setItem('s3_custom_domain', customDomain);
  }, [customDomain]);

  // 模态框状态
  const [modalConfig, setModalConfig] = useState<ModalConfig>({ type: null });
  const [modalInput, setModalInput] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [fileName, setFileName] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 主题和语言状态
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('s3_theme') as 'light' | 'dark' || 'light');
  const [lang, setLang] = useState<'zh' | 'en'>(() => localStorage.getItem('s3_lang') as 'zh' | 'en' || 'zh');

  useEffect(() => {
    localStorage.setItem('s3_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('s3_lang', lang);
  }, [lang]);

  // 国际化字典
  const t = {
    zh: {
      title: 'S3 协议代理管理器',
      subtitle: '边缘优化存储网关 (支持 R2/OSS/S3)',
      authPlaceholder: '授权密钥 (AUTH SECRET)',
      newFolder: '新建文件夹',
      upload: '上传文件',
      uploading: '上传中...',
      totalObjects: '对象总数',
      usedStorage: '已用存储',
      proxyStatus: '代理状态',
      running: '运行中',
      searchPlaceholder: '通过 Key 搜索对象...',
      domainPlaceholder: '自定义外部访问域名 (如 https://cdn.example.com)',
      root: '根目录',
      loading: '正在从边缘节点获取数据...',
      emptyFolder: '此文件夹为空。',
      doubleClick: '双击进入',
      noDomain: '未配置自定义域名，将使用代理链接',
      copyLink: '复制直链',
      download: '代理下载',
      copy: '复制',
      move: '移动',
      delete: '删除',
      name: '名称',
      size: '大小',
      lastModified: '最后修改时间',
      actions: '操作',
      cancel: '取消',
      confirm: '确认',
      deleteConfirm: '确定要删除对象',
      deleteWarning: '吗？此操作不可恢复。',
      folderName: '文件夹名称 (如: images/)',
      targetPath: '目标路径',
      selectTarget: '选择目标文件夹',
      newSubfolder: '新建子文件夹 (可选)',
      fileName: '文件名',
      previewPath: '预览目标路径:',
      footerDesc: '该网关实现了 AWS Signature Version 4 协议，可安全地与任何兼容 S3 协议的存储服务通信（如 Cloudflare R2, 阿里云 OSS, AWS S3）。所有请求均通过服务器代理，隐藏原始凭据并强制执行自定义身份验证。针对高吞吐量流式传输和极低延迟进行了优化。',
      docs: '文档',
      github: 'GitHub',
      modalConfirmDelete: '确认删除',
      modalNewFolder: '新建文件夹',
      modalCopyFile: '复制文件',
      modalMoveFile: '移动文件',
      modalRenameFile: '重命名文件',
      rename: '重命名',
      region: '区域',
      bucket: '存储桶',
      auto: '自动',
      unconfigured: '未配置',
      close: '关闭',
      authTitle: '身份验证',
      authDesc: '该网关已启用自定义鉴权，请输入 Auth Secret 以继续。',
      authInput: '输入 AUTH SECRET...',
      authButton: '验证并进入',
      proxyArchitecture: '代理架构说明',
      folderNameEmpty: '文件夹名称不能为空',
      invalidTargetPath: '目标路径无效',
      sameSourceTarget: '源路径和目标路径不能相同',
      copyFailed: '复制失败',
      moveFailed: '移动失败',
      renameFailed: '重命名失败',
      fetchFailed: '获取数据失败，请检查后端配置。',
      uploadFailed: '上传失败，请检查网络或配置。',
      deleteFailed: '删除失败，请检查网络或配置。',
      createFolderFailed: '创建文件夹失败'
    },
    en: {
      title: 'S3 Proxy Manager',
      subtitle: 'Edge-optimized storage gateway (R2/OSS/S3)',
      authPlaceholder: 'Auth Secret',
      newFolder: 'New Folder',
      upload: 'Upload File',
      uploading: 'Uploading...',
      totalObjects: 'Total Objects',
      usedStorage: 'Used Storage',
      proxyStatus: 'Proxy Status',
      running: 'Running',
      searchPlaceholder: 'Search objects by Key...',
      domainPlaceholder: 'Custom external domain (e.g. https://cdn.example.com)',
      root: 'Root',
      loading: 'Fetching data from edge nodes...',
      emptyFolder: 'This folder is empty.',
      doubleClick: 'Double click to enter',
      noDomain: 'No custom domain configured, using proxy link',
      copyLink: 'Copy Direct Link',
      download: 'Proxy Download',
      copy: 'Copy',
      move: 'Move',
      delete: 'Delete',
      name: 'Name',
      size: 'Size',
      lastModified: 'Last Modified',
      actions: 'Actions',
      cancel: 'Cancel',
      confirm: 'Confirm',
      deleteConfirm: 'Are you sure you want to delete',
      deleteWarning: '? This action cannot be undone.',
      folderName: 'Folder Name (e.g. images/)',
      targetPath: 'Target Path',
      selectTarget: 'Select Target Folder',
      newSubfolder: 'New Subfolder (Optional)',
      fileName: 'File Name',
      previewPath: 'Preview Target Path:',
      footerDesc: 'This gateway implements the AWS Signature Version 4 protocol to securely communicate with any S3-compatible storage service (e.g., Cloudflare R2, Alibaba Cloud OSS, AWS S3). All requests are proxied through the server, hiding original credentials and enforcing custom authentication. Optimized for high-throughput streaming and extremely low latency.',
      docs: 'Docs',
      github: 'GitHub',
      modalConfirmDelete: 'Confirm Delete',
      modalNewFolder: 'New Folder',
      modalCopyFile: 'Copy File',
      modalMoveFile: 'Move File',
      modalRenameFile: 'Rename File',
      rename: 'Rename',
      region: 'Region',
      bucket: 'Bucket',
      auto: 'Auto',
      unconfigured: 'Unconfigured',
      close: 'Close',
      authTitle: 'Authentication',
      authDesc: 'This gateway has custom authentication enabled. Please enter the Auth Secret to continue.',
      authInput: 'Enter AUTH SECRET...',
      authButton: 'Verify & Enter',
      proxyArchitecture: 'Proxy Architecture',
      folderNameEmpty: 'Folder name cannot be empty',
      invalidTargetPath: 'Invalid target path',
      sameSourceTarget: 'Source and target paths cannot be the same',
      copyFailed: 'Copy failed',
      moveFailed: 'Move failed',
      renameFailed: 'Rename failed',
      fetchFailed: 'Failed to fetch data, please check backend configuration.',
      uploadFailed: 'Upload failed, please check network or configuration.',
      deleteFailed: 'Delete failed, please check network or configuration.',
      createFolderFailed: 'Failed to create folder'
    }
  };

  const currentT = t[lang];

  // ==========================================
  // 派生状态 (计算文件夹和当前视图)
  // ==========================================
  const allFolders = useMemo(() => {
    const folders = new Set<string>();
    objects.forEach(obj => {
      const parts = obj.key.split('/');
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current += parts[i] + '/';
        folders.add(current);
      }
      if (obj.key.endsWith('/')) {
        folders.add(obj.key);
      }
    });
    return Array.from(folders).sort();
  }, [objects]);

  const currentViewItems = useMemo(() => {
    const items = new Map<string, S3Object & { isVirtualFolder?: boolean }>();
    
    objects.forEach(obj => {
      if (!obj.key.startsWith(currentPath)) return;
      if (obj.key === currentPath) return; // skip current folder itself
      
      const remaining = obj.key.slice(currentPath.length);
      const slashIndex = remaining.indexOf('/');
      
      if (slashIndex === -1) {
        // File
        items.set(obj.key, obj);
      } else {
        // Folder
        const folderName = remaining.slice(0, slashIndex + 1);
        const folderKey = currentPath + folderName;
        if (!items.has(folderKey)) {
          items.set(folderKey, {
            key: folderKey,
            size: 0,
            lastModified: '',
            isVirtualFolder: true
          });
        }
      }
    });
    
    return Array.from(items.values()).filter(obj => 
      obj.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [objects, currentPath, searchQuery]);

  // ==========================================
  // API 调用函数
  // ==========================================
  
  // 获取对象列表
  const fetchObjects = async (retryWithSecret?: string) => {
    setLoading(true);
    setError(null);
    const secretToUse = retryWithSecret !== undefined ? retryWithSecret : authSecret;
    
    try {
      const response = await fetch('/api/s3/list', {
        headers: {
          'X-Custom-Auth': secretToUse
        }
      });

      if (response.status === 401) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || currentT.fetchFailed);
      }
      
      const data = await response.json();
      setObjects(Array.isArray(data) ? data : []);
      setIsAuthorized(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchObjects(authSecret);
  };

  // 处理文件上传
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const targetKey = currentPath + file.name;
      const response = await fetch(`/api/s3/proxy/${targetKey.split('/').map(encodeURIComponent).join('/')}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Custom-Auth': authSecret
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || currentT.uploadFailed);
      }
      
      await fetchObjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ==========================================
  // 扩展操作：删除、创建文件夹、复制、移动、复制链接
  // ==========================================

  const handleCopyLink = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const url = customDomain 
      ? `${customDomain.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`
      : `${window.location.origin}/api/s3/proxy/${key.split('/').map(encodeURIComponent).join('/')}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openMoveCopyModal = (type: 'move' | 'copy' | 'rename', targetKey: string) => {
    const parts = targetKey.split('/');
    const isFolder = targetKey.endsWith('/');
    const name = isFolder ? parts[parts.length - 2] + '/' : parts[parts.length - 1];
    const folder = targetKey.slice(0, targetKey.length - name.length);
    
    setModalConfig({ type, targetKey });
    setSelectedFolder(folder);
    setFileName(name);
    setModalInput('');
  };

  // 关闭模态框并重置状态
  const closeModal = () => {
    setModalConfig({ type: null });
    setModalInput('');
    setSelectedFolder('');
    setFileName('');
    setModalLoading(false);
  };

  // 统一处理模态框的确认操作
  const handleModalConfirm = async () => {
    setModalLoading(true);
    setError(null);
    try {
      if (modalConfig.type === 'delete' && modalConfig.targetKey) {
        // 执行删除
        const response = await fetch(`/api/s3/proxy/${modalConfig.targetKey.split('/').map(encodeURIComponent).join('/')}`, {
          method: 'DELETE',
          headers: { 'X-Custom-Auth': authSecret }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || currentT.deleteFailed);
        }
      } 
      else if (modalConfig.type === 'folder') {
        // 执行创建文件夹
        let newFolder = modalInput.trim();
        if (!newFolder) throw new Error(currentT.folderNameEmpty);
        if (!newFolder.endsWith('/')) newFolder += '/';
        const finalKey = currentPath + newFolder;

        const response = await fetch('/api/s3/action/folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Custom-Auth': authSecret },
          body: JSON.stringify({ folderName: finalKey })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || currentT.createFolderFailed);
        }
      }
      else if ((modalConfig.type === 'copy' || modalConfig.type === 'move' || modalConfig.type === 'rename') && modalConfig.targetKey) {
        // 执行复制、移动或重命名
        let subFolder = modalInput.trim().replace(/^\/+/, '').replace(/\/+$/, '');
        if (subFolder) subFolder += '/';
        
        const finalDestination = modalConfig.type === 'rename' 
          ? selectedFolder + fileName
          : selectedFolder + subFolder + fileName;
        
        if (!finalDestination || finalDestination === '/') throw new Error(currentT.invalidTargetPath);
        if (finalDestination === modalConfig.targetKey) throw new Error(currentT.sameSourceTarget);

        const endpoint = modalConfig.type === 'copy' ? '/api/s3/action/copy' : '/api/s3/action/move';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Custom-Auth': authSecret },
          body: JSON.stringify({ sourceKey: modalConfig.targetKey, destinationKey: finalDestination })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || (
            modalConfig.type === 'copy' ? currentT.copyFailed : 
            modalConfig.type === 'move' ? currentT.moveFailed : 
            currentT.renameFailed
          ));
        }
      }

      await fetchObjects();
      closeModal();
    } catch (err: any) {
      setError(err.message);
      setModalLoading(false);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件对应的图标
  const getFileIcon = (key: string) => {
    if (key.endsWith('/')) return <Folder className="w-4 h-4 text-yellow-600" />;
    const ext = key.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-4 h-4" />;
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return <Video className="w-4 h-4" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    let pathAccumulator = '';
    
    return (
      <div className="flex items-center gap-2 text-sm font-mono mb-4 bg-bg-card/50 p-3 border border-border-main overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setCurrentPath('')}
          className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-bold"
        >
          <HardDrive className="w-4 h-4" />
          {currentT.root}
        </button>
        {parts.map((part) => {
          pathAccumulator += part + '/';
          const currentAcc = pathAccumulator;
          return (
            <React.Fragment key={currentAcc}>
              <ChevronRight className="w-3 h-3 opacity-40 flex-shrink-0" />
              <button 
                onClick={() => setCurrentPath(currentAcc)}
                className="hover:text-emerald-600 transition-colors font-bold"
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md border border-border-main bg-bg-card p-8 shadow-[8px_8px_0px_0px_var(--color-border-main)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6" />
            <h2 className="text-xl font-bold italic font-serif uppercase">{currentT.authTitle}</h2>
          </div>
          <p className="text-xs opacity-60 mb-6 font-mono uppercase tracking-widest">{currentT.authDesc}</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              placeholder={currentT.authInput}
              value={authSecret}
              onChange={(e) => setAuthSecret(e.target.value)}
              className="w-full bg-bg-main border border-border-main p-3 text-sm font-mono focus:outline-none focus:bg-bg-card/50 transition-colors"
              autoFocus
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-bg-invert text-text-invert py-3 font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : currentT.authButton}
            </button>
          </form>
          {error && <p className="mt-4 text-xs text-red-600 font-mono">{error}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-bg-invert selection:text-text-invert">
      {/* Header */}
      <header className="border-b border-border-main p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-bg-invert p-2 rounded-sm">
            <HardDrive className="text-text-invert w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase italic font-serif">{currentT.title}</h1>
            <p className="text-[11px] opacity-50 uppercase tracking-widest font-mono">{currentT.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="p-2 border border-border-main hover:bg-bg-invert hover:text-text-invert transition-all"
            title="Switch Language"
          >
            <Languages className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 border border-border-main hover:bg-bg-invert hover:text-text-invert transition-all"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-40" />
            <input 
              type="password"
              placeholder={currentT.authPlaceholder}
              value={authSecret}
              onChange={(e) => setAuthSecret(e.target.value)}
              className="bg-transparent border border-border-main/20 rounded-none px-8 py-2 text-[11px] font-mono focus:outline-none focus:border-border-main transition-colors w-48"
            />
          </div>
          <button 
            onClick={fetchObjects}
            className="p-2 border border-border-main hover:bg-bg-invert hover:text-text-invert transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setModalConfig({ type: 'folder' })}
            className="flex items-center gap-2 bg-transparent border border-border-main text-text-main px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-bg-invert hover:text-text-invert transition-colors"
          >
            <FolderPlus className="w-3 h-3" />
            {currentT.newFolder}
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-bg-invert text-text-invert px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? currentT.uploading : currentT.upload}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {[
            { label: currentT.totalObjects, value: objects.length, icon: File },
            { label: currentT.usedStorage, value: formatSize(objects.reduce((acc, obj) => acc + obj.size, 0)), icon: HardDrive },
            { label: currentT.proxyStatus, value: currentT.running, icon: Shield, color: 'text-emerald-600' },
          ].map((stat, i) => (
            <div key={i} className="border border-border-main p-3 flex items-center justify-between group hover:bg-bg-invert hover:text-text-invert transition-colors cursor-default">
              <div>
                <p className="text-[9px] uppercase tracking-widest opacity-50 font-mono mb-0.5">{stat.label}</p>
                <p className={`text-lg font-bold font-serif italic ${stat.color || ''}`}>{stat.value}</p>
              </div>
              <stat.icon className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Search & Filter & Domain */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input 
              type="text"
              placeholder={currentT.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-border-main p-4 pl-12 text-sm font-mono focus:outline-none focus:bg-bg-card/50 transition-colors"
            />
          </div>
          <div className="relative md:w-96">
            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input 
              type="text"
              placeholder={currentT.domainPlaceholder}
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="w-full bg-transparent border border-border-main p-4 pl-12 text-sm font-mono focus:outline-none focus:bg-bg-card/50 transition-colors"
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        {renderBreadcrumbs()}

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 border border-red-500 bg-red-50 text-red-700 flex items-center gap-3 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto uppercase text-[10px] font-bold">{currentT.close}</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Grid */}
        <div className="border border-border-main bg-bg-card/30 overflow-hidden">
          {/* Grid Header */}
          <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] p-4 border-b border-border-main bg-bg-invert text-text-invert text-[10px] uppercase tracking-widest font-mono">
            <div></div>
            <div>{currentT.name} (Key)</div>
            <div>{currentT.size}</div>
            <div>{currentT.lastModified}</div>
            <div className="text-right">{currentT.actions}</div>
          </div>

          {/* Grid Body */}
          <div className="divide-y divide-border-main/10">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                <p className="text-[11px] uppercase tracking-widest opacity-40 font-mono">{currentT.loading}</p>
              </div>
            ) : currentViewItems.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[11px] uppercase tracking-widest opacity-40 font-mono">{currentT.emptyFolder}</p>
              </div>
            ) : (
              currentViewItems.map((obj, i) => {
                const isFolder = obj.key.endsWith('/') || obj.isVirtualFolder;
                const displayName = obj.key.slice(currentPath.length);
                
                return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={obj.key} 
                  onDoubleClick={() => {
                    if (isFolder) setCurrentPath(obj.key);
                  }}
                  className="grid grid-cols-[40px_1.5fr_1fr_1fr_100px] p-4 items-center hover:bg-bg-invert hover:text-text-invert transition-colors group cursor-pointer"
                >
                  <div className="opacity-40 group-hover:opacity-100">{getFileIcon(obj.key)}</div>
                  <div className="font-mono text-xs truncate pr-4 flex flex-col gap-1 justify-center">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{displayName}</span>
                      {isFolder && <span className="text-[9px] bg-bg-invert/10 text-text-main group-hover:bg-bg-card/20 group-hover:text-white px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0">{currentT.doubleClick}</span>}
                    </div>
                    {!isFolder && (
                      <span className="text-[9px] opacity-40 truncate group-hover:opacity-70 transition-opacity">
                        {customDomain ? `${customDomain.replace(/\/$/, '')}/${obj.key.split('/').map(encodeURIComponent).join('/')}` : currentT.noDomain}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs opacity-60 group-hover:opacity-100">{isFolder ? '-' : formatSize(obj.size)}</div>
                  <div className="font-mono text-[10px] opacity-60 group-hover:opacity-100">
                    {obj.lastModified ? new Date(obj.lastModified).toLocaleString() : '-'}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {!isFolder && (
                      <>
                        <button 
                          onClick={(e) => handleCopyLink(e, obj.key)}
                          className="p-1.5 border border-transparent hover:border-current rounded-sm transition-all text-emerald-600 hover:text-emerald-800"
                          title={currentT.copyLink}
                        >
                          {copiedKey === obj.key ? <Check className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                        </button>
                        <a 
                          href={`/api/s3/proxy/${obj.key.split('/').map(encodeURIComponent).join('/')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 border border-transparent hover:border-current rounded-sm transition-all"
                          title={currentT.download}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); openMoveCopyModal('rename', obj.key); }}
                      className="p-1.5 border border-transparent hover:border-current rounded-sm transition-all"
                      title={currentT.rename}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openMoveCopyModal('copy', obj.key); }}
                      className="p-1.5 border border-transparent hover:border-current rounded-sm transition-all"
                      title={currentT.copy}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openMoveCopyModal('move', obj.key); }}
                      className="p-1.5 border border-transparent hover:border-current rounded-sm transition-all"
                      title={currentT.move}
                    >
                      <MoveRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setModalConfig({ type: 'delete', targetKey: obj.key }); }}
                      className="p-1.5 border border-transparent hover:border-red-500 hover:text-red-500 rounded-sm transition-all"
                      title={currentT.delete}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )})
            )}
          </div>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 pt-6 border-t border-border-main/10 flex flex-col md:flex-row justify-between gap-6">
          <div className="max-w-md">
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2">{currentT.proxyArchitecture}</h3>
            <p className="text-xs opacity-60 leading-relaxed">
              {currentT.footerDesc}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentT.region}: {process.env.AWS_REGION || currentT.auto}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentT.bucket}: {process.env.BUCKET_NAME || currentT.unconfigured}</span>
            </div>
          </div>
        </footer>
      </main>

      {/* ========================================== */}
      {/* 模态框 (Modal) */}
      {/* ========================================== */}
      <AnimatePresence>
        {modalConfig.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-muted0 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-bg-main border border-border-main p-6 shadow-[8px_8px_0px_0px_var(--color-border-main)]"
            >
              <h3 className="text-lg font-bold italic font-serif uppercase mb-4">
                {modalConfig.type === 'delete' && currentT.modalConfirmDelete}
                {modalConfig.type === 'folder' && currentT.modalNewFolder}
                {modalConfig.type === 'copy' && currentT.modalCopyFile}
                {modalConfig.type === 'move' && currentT.modalMoveFile}
                {modalConfig.type === 'rename' && currentT.modalRenameFile}
              </h3>
              
              <div className="mb-6">
                {modalConfig.type === 'delete' && (
                  <p className="text-sm font-mono">{currentT.deleteConfirm} <span className="font-bold text-red-600">{modalConfig.targetKey}</span> {currentT.deleteWarning}</p>
                )}
                
                {modalConfig.type === 'folder' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60">
                      {currentT.folderName}
                    </label>
                    <input 
                      type="text"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                      placeholder={currentT.folderName}
                      className="w-full bg-bg-card border border-border-main p-3 text-sm font-mono focus:outline-none"
                      autoFocus
                    />
                  </div>
                )}

                {(modalConfig.type === 'copy' || modalConfig.type === 'move' || modalConfig.type === 'rename') && (
                  <div className="space-y-4">
                    {modalConfig.type !== 'rename' && (
                      <>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">{currentT.selectTarget}</label>
                          <select 
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className="w-full bg-bg-card border border-border-main p-3 text-sm font-mono focus:outline-none"
                          >
                            <option value="">/ ({currentT.root})</option>
                            {allFolders.map(f => (
                              <option key={f} value={f}>/{f}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">{currentT.newSubfolder}</label>
                          <input 
                            type="text"
                            value={modalInput}
                            onChange={(e) => setModalInput(e.target.value)}
                            placeholder="new-folder"
                            className="w-full bg-bg-card border border-border-main p-3 text-sm font-mono focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest opacity-60 block mb-2">{currentT.fileName}</label>
                      <input 
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="w-full bg-bg-card border border-border-main p-3 text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div className="p-3 bg-bg-muted border border-border-main/20">
                      <p className="text-[10px] opacity-50 font-mono mb-1 uppercase tracking-widest">{currentT.previewPath}</p>
                      <p className="text-xs font-mono break-all font-bold">
                        {modalConfig.type === 'rename' 
                          ? `/${selectedFolder}${fileName}`
                          : `/${selectedFolder}${modalInput.trim() ? `${modalInput.trim().replace(/^\/+/, '').replace(/\/+$/, '')}/` : ''}${fileName}`
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={closeModal}
                  disabled={modalLoading}
                  className="px-4 py-2 border border-border-main text-sm font-bold uppercase tracking-wider hover:bg-bg-card transition-colors disabled:opacity-50"
                >
                  {currentT.cancel}
                </button>
                <button 
                  onClick={handleModalConfirm}
                  disabled={
                    modalLoading || 
                    (modalConfig.type === 'folder' && !modalInput.trim()) ||
                    ((modalConfig.type === 'copy' || modalConfig.type === 'move' || modalConfig.type === 'rename') && !fileName.trim())
                  }
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 ${
                    modalConfig.type === 'delete' 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-bg-invert text-text-invert hover:opacity-90'
                  }`}
                >
                  {modalLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {currentT.confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
