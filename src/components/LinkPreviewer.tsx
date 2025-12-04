import classNames from 'classnames';
import {
  onCleanup,
  createSignal,
  createEffect,
  Show,
  type JSXElement,
} from 'solid-js';
import Popup from './Popup';

interface LinkPreviewerProps {
  children?: JSXElement;
  url: string;
}

// 配置常量
const DEBOUNCE_DELAY = 200; // 减少显示延迟，提升响应速度
const HIDE_DELAY = 150; // 隐藏延迟，给用户时间移动鼠标
const PREVIEW_WIDTH = 384;
const PREVIEW_HEIGHT = 256;
const IFRAME_ACTUAL_WIDTH = 1200;
const IFRAME_ACTUAL_HEIGHT = 800;
// 计算精确的缩放比例以铺满容器 (384/1200 = 0.32)
const IFRAME_SCALE = PREVIEW_WIDTH / IFRAME_ACTUAL_WIDTH;
const LOAD_TIMEOUT = 8000;

// 简单的缓存状态 - 使用 Set 实现高效的 URL 缓存
const loadedUrls = new Set<string>();
const failedUrls = new Set<string>();

/**
 * 检查是否为移动设备
 * 移动端禁用预览功能以提升性能
 */
function isMobileDevice() {
  return window.innerWidth <= 768;
}

/**
 * 验证URL格式
 * 确保只处理有效的URL地址
 */
function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 链接预览组件
 * 提供优雅的链接预览功能，支持缓存、错误处理和响应式设计
 */
export default function LinkPreviewer(props: LinkPreviewerProps) {
  const [showPreviewer, setShowPreviewer] = createSignal(false);
  const [targetElement, setTargetElement] = createSignal<HTMLElement>();
  const [isLoading, setIsLoading] = createSignal(false);
  const [hasError, setHasError] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal('');
  const [iframeSrc, setIframeSrc] = createSignal('');

  let debounceTimer: number | undefined;
  let hideTimer: number | undefined;
  let loadTimer: number | undefined;
  let setSrcTimer: number | undefined;

  async function showPreview() {
    if (!isValidUrl(props.url)) {
      setHasError(true);
      setErrorMessage('无效的URL地址');
      setShowPreviewer(true);
      return;
    }

    if (isMobileDevice()) {
      return;
    }

    // 清除隐藏定时器，防止在移入时刚好被隐藏
    clearTimeout(hideTimer);
    setShowPreviewer(true);
    await loadPreview();
  }

  async function loadPreview() {
    // 如果已经有内容了，就不再重复加载（DOM缓存了）
    if (iframeSrc() === props.url && !hasError()) {
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    if (loadedUrls.has(props.url)) {
      setIsLoading(false);
      setHasError(false);
      setIframeSrc(props.url);
      return;
    }

    if (failedUrls.has(props.url)) {
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('之前加载失败，可能是跨域限制或网络问题');
      return;
    }

    await loadPreviewContent();
  }

  async function loadPreviewContent() {
    setSrcTimer = window.setTimeout(() => {
      setIframeSrc(props.url);

      loadTimer = window.setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('加载超时，请稍后重试');
        failedUrls.add(props.url);
      }, LOAD_TIMEOUT);
    }, 100);
  }

  function handleIframeLoad() {
    clearTimeout(loadTimer);
    setIsLoading(false);
    setHasError(false);
    loadedUrls.add(props.url);
  }

  function handleIframeError() {
    clearTimeout(loadTimer);
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('无法加载预览内容，可能是跨域限制或网络问题');
    failedUrls.add(props.url);
  }

  function handleMouseEnter(e: MouseEvent) {
    const target = e.target as HTMLElement;
    setTargetElement(target);
    clearTimeout(debounceTimer);
    clearTimeout(hideTimer); // 清除隐藏计时器

    debounceTimer = window.setTimeout(() => {
      showPreview();
    }, DEBOUNCE_DELAY);
  }

  function handleMouseLeave() {
    clearTimeout(debounceTimer);
    clearTimeout(loadTimer);
    clearTimeout(setSrcTimer);
    
    // 延时隐藏，允许用户移入 Popup
    hideTimer = window.setTimeout(() => {
      setShowPreviewer(false);
    }, HIDE_DELAY);
  }

  // Popup 鼠标移入事件：保持显示
  function handlePopupMouseEnter() {
    clearTimeout(hideTimer);
    clearTimeout(debounceTimer);
    setShowPreviewer(true);
  }

  // Popup 鼠标移出事件：延时隐藏
  function handlePopupMouseLeave() {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      setShowPreviewer(false);
    }, HIDE_DELAY);
  }

  function handleLinkClick(event: MouseEvent) {
    event.preventDefault();
    window.open(props.url, '_blank');
  }

  // 点击 Popup 区域跳转（适用于遮罩层点击）
  function handlePopupClick(event: MouseEvent) {
    // 允许复制文本等操作，所以不一定要 preventDefault，
    // 但如果有遮罩层拦截，直接跳转
    window.open(props.url, '_blank');
  }

  onCleanup(() => {
    clearTimeout(debounceTimer);
    clearTimeout(hideTimer);
    clearTimeout(loadTimer);
    clearTimeout(setSrcTimer);
  });

  return (
    <>
      <a
        href={props.url}
        data-hover
        class="text-violet-500 hover:text-violet-400 transition-all duration-200 hover:text-violet-300 hover:underline hover:underline-offset-4 hover:decoration-violet-500/50 relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleLinkClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLinkClick(e as any);
          }
        }}
      >
        <span class="relative z-10">{props.children}</span>
        <span class="absolute inset-0 bg-violet-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></span>
      </a>

      <Popup
        show={showPreviewer()}
        target={targetElement()}
        placement="bottom"
        offset={[0, 12]}
        animation="fade"
        duration={200}
        variant="default"
        size="md"
        rounded="xl"
        shadow="2xl"
        backdrop={false}
        autoAdjust={true}
        flip={true}
        zIndex={50}
        destroyOnHide={false} // 启用 DOM 缓存
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
        style={{
          width: `${PREVIEW_WIDTH}px`,
          height: `${PREVIEW_HEIGHT}px`,
          padding: 0, // 移除内边距，完全自定义内容
          // 确保 Popup 本身可交互，但内容交互由内部控制
          'pointer-events': 'auto',
        }}
      >
        <div
          class="relative w-full h-full overflow-hidden rounded-xl bg-[#13151a]/95 backdrop-blur-xl border border-violet-500/20 shadow-[0_25px_50px_-12px_rgba(136,58,234,0.25),0_0_0_1px_rgba(136,58,234,0.1)] flex flex-col"
        >
          {/* 背景装饰 */}
          <div class="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          <div class="absolute inset-0 bg-[url('/images/bg-grid.png')] opacity-[0.02] pointer-events-none"></div>

          {/* 浏览器顶部栏 - Mac 风格 */}
          <div
            class="relative z-20 h-8 bg-[#1a1b26] border-b border-white/5 flex items-center px-3 gap-3 shrink-0 cursor-pointer"
            onClick={handlePopupClick}
          >
            {/* 红绿灯按钮 */}
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]/50"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#febc2e] border border-[#d89e24]/50"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-[#28c840] border border-[#1aab29]/50"></div>
            </div>
            
            {/* 地址栏 */}
            <div class="flex-1 h-5 bg-[#0f1115] rounded border border-white/5 flex items-center px-2 overflow-hidden">
               {/* 锁图标 */}
              <svg class="w-2.5 h-2.5 text-green-500 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="text-[10px] text-gray-500 truncate font-mono">{props.url}</span>
            </div>
          </div>

          <div class="relative flex-1 w-full bg-white overflow-hidden">
             {/* 加载状态 */}
             <Show when={isLoading()}>
              <div class="absolute inset-0 flex items-center justify-center bg-[#13151a]/90 backdrop-blur-sm z-30 pointer-events-none">
                <div class="flex flex-col items-center space-y-4">
                  <div class="relative">
                    <div class="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                  </div>
                  <span class="text-gray-400 text-xs font-medium">Loading preview...</span>
                </div>
              </div>
            </Show>

            {/* 错误状态 */}
            <Show when={hasError()}>
              <div class="absolute inset-0 flex items-center justify-center bg-[#13151a]/90 backdrop-blur-sm z-30 pointer-events-none">
                <div class="flex flex-col items-center space-y-3 p-4 text-center max-w-[280px]">
                  <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <span class="text-gray-400 text-xs">{errorMessage()}</span>
                </div>
              </div>
            </Show>

            {/* 内容区域 */}
            <div class="relative w-full h-full">
               <iframe
                src={iframeSrc()}
                width={IFRAME_ACTUAL_WIDTH}
                height={IFRAME_ACTUAL_HEIGHT}
                class="border-0 absolute top-0 left-0 bg-white"
                style={{
                  width: `${IFRAME_ACTUAL_WIDTH}px`,
                  height: `${IFRAME_ACTUAL_HEIGHT}px`,
                  transform: `scale(${IFRAME_SCALE})`,
                  'transform-origin': 'top left',
                  // 这里的 pointer-events: none 是针对 iframe 内部的
                  // 但为了支持滚动（如果有需求的话），通常需要特殊处理。
                  // 根据需求 "屏蔽 iframe 交互"，这里保持 none
                  'pointer-events': 'none',
                }}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                loading="lazy"
                tabIndex={-1}
              />
              
              {/* 透明遮罩层：拦截点击并跳转 */}
              <div
                class="absolute inset-0 z-10 cursor-pointer bg-transparent"
                onClick={handlePopupClick}
                title="点击在新窗口打开"
              ></div>
            </div>
            
            {/* 底部内阴影装饰 */}
            <div class="absolute inset-0 border border-violet-500/10 pointer-events-none z-20"></div>
          </div>
        </div>
      </Popup>
    </>
  );
}
