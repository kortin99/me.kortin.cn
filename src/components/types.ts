import type { JSXElement, JSX } from 'solid-js';

// 基础属性接口
export interface PopupBaseProps {
  // 显示控制
  show: boolean;
  onClose?: () => void;

  // 内容
  children: JSXElement;

  // 基础样式
  class?: string;
  style?: JSX.CSSProperties | string;

  // 基础配置
  id?: string;
  zIndex?: number;
  
  // 销毁策略
  destroyOnHide?: boolean;
}

// 定位相关接口
export interface PopupPositionProps {
  // 目标元素
  target?: HTMLElement | { x: number; y: number };

  // 定位模式
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto';

  // 偏移量
  offset?: [number, number]; // [x, y]

  // 边界检测
  boundary?: 'viewport' | 'window' | 'parent' | HTMLElement;

  // 自适应
  autoAdjust?: boolean;
  flip?: boolean;
  shift?: boolean;
}

// 动画相关接口
export interface PopupAnimationProps {
  // 动画类型
  animation?: 'fade' | 'scale' | 'slide' | 'bounce' | 'none' | 'custom';

  // 动画方向
  direction?: 'up' | 'down' | 'left' | 'right';

  // 动画时长
  duration?: number;

  // 动画延迟
  delay?: number;

  // 自定义动画类
  animationClass?: {
    enter?: string;
    enterActive?: string;
    exit?: string;
    exitActive?: string;
  };
}

// 交互相关接口
export interface PopupInteractionProps {
  // 关闭方式
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  closeOnScroll?: boolean;

  // 悬停行为
  hoverDelay?: number;
  leaveDelay?: number;

  // 鼠标事件
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;

  // 焦点管理
  trapFocus?: boolean;
  initialFocus?: HTMLElement | 'first' | 'last' | 'container';

  // 阻止滚动
  preventScroll?: boolean;

  // 懒加载
  lazy?: boolean;
  lazyThreshold?: number;
}

// 主题相关接口
export interface PopupThemeProps {
  // 主题变体
  variant?: 'default' | 'tooltip' | 'modal' | 'dropdown' | 'custom';

  // 尺寸
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // 圆角
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // 阴影
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  // 边框
  border?: boolean | string;

  // 背景模糊
  backdrop?: boolean | 'sm' | 'md' | 'lg' | 'xl';

  // 自定义主题
  theme?: {
    background?: string;
    foreground?: string;
    border?: string;
    shadow?: string;
  };
}

// 完整的 Popup Props 接口
export interface PopupProps extends
  PopupBaseProps,
  PopupPositionProps,
  PopupAnimationProps,
  PopupInteractionProps,
  PopupThemeProps {

  // 高级配置
  portal?: boolean | string;
  strategy?: 'absolute' | 'fixed';

  // 事件回调
  onShow?: () => void;
  onShown?: () => void;
  onHide?: () => void;
  onHidden?: () => void;
  onPositionUpdate?: (position: Position) => void;

  // 渲染控制
  render?: (props: PopupRenderProps) => JSXElement;

  // 测试
  testId?: string;
}

// 内部使用的位置接口
export interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
  placement?: string;
  adjusted?: boolean;
}

// 渲染属性接口
export interface PopupRenderProps {
  position: Position;
  isShowing: boolean;
  isHiding: boolean;
  close: () => void;
  updatePosition: () => void;
}
