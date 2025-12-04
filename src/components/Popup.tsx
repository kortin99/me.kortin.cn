import {
  createSignal,
  createEffect,
  onCleanup,
  Show,
  type JSXElement,
  type JSX
} from 'solid-js';
import { Portal } from 'solid-js/web';
import classNames from 'classnames';
import type { PopupProps, Position } from './types';

/**
 * 高度可配置的弹窗组件
 * 支持多种主题变体、智能定位、响应式设计和完整的可访问性支持
 */
export default function Popup(props: PopupProps) {
  const [position, setPosition] = createSignal<Position>({ x: 0, y: 0 });
  const [popupElement, setPopupElement] = createSignal<HTMLElement>();
  const [isReady, setIsReady] = createSignal(false);

  /**
   * 响应式尺寸计算
   * 根据屏幕尺寸动态调整弹窗大小和边距
   */
  const getResponsiveSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth <= 768;
    const isTablet = screenWidth <= 1024;

    // 根据屏幕尺寸调整弹窗大小
    if (isMobile) {
      return {
        width: Math.min(screenWidth - 32, 320),
        height: Math.min(screenHeight - 32, 240),
        margin: 16
      };
    } else if (isTablet) {
      return {
        width: Math.min(screenWidth * 0.8, 400),
        height: Math.min(screenHeight * 0.6, 300),
        margin: 20
      };
    } else {
      return {
        width: 400,
        height: 200,
        margin: 10
      };
    }
  };

  /**
   * 智能位置计算
   * 支持多种定位模式、边界检测和自动翻转
   */
  const calculatePosition = () => {
    if (!props.target) {
      // 如果没有目标，使用视口中心
      const { width, height } = getResponsiveSize();
      return {
        x: window.innerWidth / 2 - width / 2,
        y: window.innerHeight / 2 - height / 2,
        placement: 'center',
        adjusted: false
      };
    }

    if (typeof props.target === 'object' && 'x' in props.target) {
      // 坐标对象
      return {
        x: props.target.x,
        y: props.target.y,
        placement: 'custom',
        adjusted: false
      };
    }

    // HTMLElement
    const targetRect = props.target.getBoundingClientRect();
    const placement = props.placement || 'bottom';
    const offset = props.offset || [0, 0];
    const { width: popupWidth, height: popupHeight, margin } = getResponsiveSize();

    let x = 0;
    let y = 0;
    let adjusted = false;

    switch (placement) {
      case 'top':
        x = targetRect.left + targetRect.width / 2 - popupWidth / 2 + offset[0];
        y = targetRect.top - popupHeight + offset[1];
        break;
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - popupWidth / 2 + offset[0];
        y = targetRect.bottom + offset[1];
        break;
      case 'left':
        x = targetRect.left - popupWidth + offset[0];
        y = targetRect.top + targetRect.height / 2 - popupHeight / 2 + offset[1];
        break;
      case 'right':
        x = targetRect.right + offset[0];
        y = targetRect.top + targetRect.height / 2 - popupHeight / 2 + offset[1];
        break;
      case 'center':
        x = window.innerWidth / 2 - popupWidth / 2 + offset[0];
        y = window.innerHeight / 2 - popupHeight / 2 + offset[1];
        break;
      default:
        // 默认为 bottom
        x = targetRect.left + targetRect.width / 2 - popupWidth / 2 + offset[0];
        y = targetRect.bottom + offset[1];
    }

    // 智能边界检测和调整
    const originalX = x;
    const originalY = y;

    // 水平边界检测
    if (x < margin) {
      x = margin;
      adjusted = true;
    } else if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
      adjusted = true;
    }

    // 垂直边界检测
    if (y < margin) {
      y = margin;
      adjusted = true;
    } else if (y + popupHeight > window.innerHeight - margin) {
      y = window.innerHeight - popupHeight - margin;
      adjusted = true;
    }

    // 如果是tooltip或dropdown类型，尝试翻转位置
    if ((props.variant === 'tooltip' || props.variant === 'dropdown') && props.flip) {
      if (placement === 'top' && originalY < margin) {
        // 翻转到底部
        y = targetRect.bottom + offset[1];
        adjusted = true;
      } else if (placement === 'bottom' && originalY + popupHeight > window.innerHeight - margin) {
        // 翻转到顶部
        y = targetRect.top - popupHeight + offset[1];
        adjusted = true;
      } else if (placement === 'left' && originalX < margin) {
        // 翻转到右侧
        x = targetRect.right + offset[0];
        adjusted = true;
      } else if (placement === 'right' && originalX + popupWidth > window.innerWidth - margin) {
        // 翻转到左侧
        x = targetRect.left - popupWidth + offset[0];
        adjusted = true;
      }
    }

    return { x, y, placement, adjusted };
  };

  /**
   * 更新弹窗位置
   * 触发位置重新计算和更新回调
   */
  const updatePosition = () => {
    const newPosition = calculatePosition();
    setPosition(newPosition);
    props.onPositionUpdate?.(newPosition);
  };

  // 监听显示状态变化
  createEffect(() => {
    if (props.show) {
      // 立即设置位置
      const newPosition = calculatePosition();
      setPosition(newPosition);
      props.onPositionUpdate?.(newPosition);
      
      // 标记为已就绪，允许显示
      setIsReady(true);

      // 使用 requestAnimationFrame 确保位置在下一帧渲染前已设置
      requestAnimationFrame(() => {
        const updatedPosition = calculatePosition();
        setPosition(updatedPosition);
        props.onPositionUpdate?.(updatedPosition);
      });
    } else {
      // 隐藏时重置就绪状态，确保下次显示时重新计算前不显示
      setIsReady(false);
    }
  });

  // 监听窗口大小变化
  createEffect(() => {
    if (props.show) {
      const handleResize = () => {
        updatePosition();
      };

      const handleScroll = () => {
        updatePosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);

      onCleanup(() => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      });
    }
  });

  /**
   * 计算动态样式
   * 整合响应式尺寸和自定义样式
   */
  const computedStyle = () => {
    const { width, height } = getResponsiveSize();
    const baseStyle: JSX.CSSProperties = {
      position: props.strategy || 'fixed',
      left: `${position().x}px`,
      top: `${position().y}px`,
      width: `${width}px`,
      height: `${height}px`,
      'z-index': props.zIndex || 50,
      'max-width': 'calc(100vw - 32px)',
      'max-height': 'calc(100vh - 32px)'
    };

    // 处理 destroyOnHide=false 时的隐藏状态
    const displayStyle: JSX.CSSProperties = {};
    if ((props.destroyOnHide === false && !props.show) || !isReady()) {
      // 未就绪或明确隐藏时不可见
      displayStyle.visibility = 'hidden';
      displayStyle.opacity = 0;
      // 当隐藏时阻止指针事件
      displayStyle['pointer-events'] = 'none';
    }

    if (typeof props.style === 'string') {
      // 如果是字符串样式且需要隐藏
      if ((props.destroyOnHide === false && !props.show) || !isReady()) {
         return `${props.style}; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;`;
      }
      return props.style;
    }

    const customStyle = props.style as JSX.CSSProperties || {};
    return {
      ...baseStyle,
      ...customStyle,
      // 如果自定义样式中指定了宽度或高度，优先使用
      ...(customStyle.width && { width: customStyle.width }),
      ...(customStyle.height && { height: customStyle.height }),
      ...displayStyle
    };
  };

  /**
   * 计算CSS类名
   * 根据主题变体、尺寸、圆角和阴影配置生成类名
   */
  const computedClass = () => {
    const variant = props.variant || 'default';
    const size = props.size || 'md';
    const rounded = props.rounded || 'lg';
    const shadow = props.shadow || '2xl';

    const baseClasses = {
      'default': 'bg-[#13151a]/95 backdrop-blur-xl border border-violet-500/20 shadow-[0_25px_50px_-12px_rgba(136,58,234,0.25),0_0_0_1px_rgba(136,58,234,0.1)] rounded-xl transition-opacity duration-300 ease-out animate-in fade-in',
      'tooltip': 'bg-[#1a1b26]/95 backdrop-blur-md border border-violet-500/15 shadow-[0_10px_25px_-5px_rgba(136,58,234,0.2),0_0_0_1px_rgba(136,58,234,0.05)] rounded-lg py-2 px-3 transition-opacity duration-200 ease-out animate-in fade-in',
      'modal': 'bg-[#13151a]/98 backdrop-blur-2xl border border-violet-500/30 shadow-[0_25px_50px_-12px_rgba(136,58,234,0.35),0_0_0_1px_rgba(136,58,234,0.15)] rounded-2xl transition-opacity duration-300 ease-out animate-in fade-in',
      'dropdown': 'bg-[#1a1b26]/95 backdrop-blur-lg border border-violet-500/15 shadow-[0_20px_40px_-10px_rgba(136,58,234,0.25),0_0_0_1px_rgba(136,58,234,0.08)] rounded-xl py-2 transition-opacity duration-250 ease-out animate-in fade-in',
      'custom': ''
    };

    const sizeClasses = {
      'sm': 'w-48 h-32',
      'md': 'w-64 h-48',
      'lg': 'w-80 h-60',
      'xl': 'w-96 h-72',
      'full': 'w-screen h-screen'
    };

    const roundedClasses = {
      'none': 'rounded-none',
      'sm': 'rounded-sm',
      'md': 'rounded-md',
      'lg': 'rounded-lg',
      'xl': 'rounded-xl',
      '2xl': 'rounded-2xl',
      'full': 'rounded-full'
    };

    const shadowClasses = {
      'none': '',
      'sm': 'shadow-sm',
      'md': 'shadow-md',
      'lg': 'shadow-lg',
      'xl': 'shadow-xl',
      '2xl': 'shadow-2xl'
    };

    return classNames(
      'popup-component',
      baseClasses[variant],
      sizeClasses[size],
      roundedClasses[rounded],
      shadowClasses[shadow],
      props.class
    );
  };

  /**
   * 内容渲染器
   * 支持自定义渲染函数或默认子元素渲染
   */
  const renderContent = () => {
    if (props.render) {
      return props.render({
        position: position(),
        isShowing: props.show,
        isHiding: false,
        close: () => props.onClose?.(),
        updatePosition
      });
    }

    return props.children;
  };

  /**
   * 获取 Portal 挂载点
   * 支持默认 body、选择器字符串或指定元素
   */
  const getPortalMount = () => {
    if (!props.portal) return undefined;
    if (props.portal === true) return document.body;
    if (typeof props.portal === 'string') {
      return document.querySelector(props.portal) || undefined;
    }
    return props.portal;
  };

  // 决定是否渲染 DOM
  // 默认 destroyOnHide 为 true (undefined 也视为 true)，即 !show 时销毁
  // 如果 destroyOnHide 为 false，则始终渲染（通过样式控制显隐）
  const shouldRender = () => {
    if (props.destroyOnHide === false) return true;
    return props.show;
  };

  return (
    <Show when={shouldRender()}>
      <Portal mount={getPortalMount()}>
        <div
          ref={setPopupElement}
          class={computedClass()}
          style={computedStyle()}
          data-testid={props.testId}
          data-placement={position().placement}
          id={props.id}
          role={props.variant === 'modal' ? 'dialog' : 'tooltip'}
          aria-modal={props.variant === 'modal'}
          tabIndex={props.variant === 'modal' ? -1 : undefined}
          onMouseEnter={props.onMouseEnter}
          onMouseLeave={props.onMouseLeave}
        >
          <div class="popup-content w-full h-full" role="document">
            {renderContent()}
          </div>
        </div>
      </Portal>
    </Show>
  );
}

// 导出类型供外部使用
export type { PopupProps, Position } from './types';
