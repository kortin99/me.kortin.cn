import { onCleanup, onMount, createSignal, createEffect } from "solid-js";

interface Pacman {
  radius: number;
  lastX: number;
  lastY: number;
}

export default function Cursor() {
  // 移动端触摸设备不展示
  if (
    typeof window === "undefined" ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
  ) {
    return null;
  }

  const [dimensions, setDimensions] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [mousePosition, setMousePosition] = createSignal({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [pacman, setPacman] = createSignal<Pacman>({
    radius: 14,
    lastX: mousePosition().x,
    lastY: mousePosition().y,
  });
  const [isHovered, setIsHovered] = createSignal(false);

  function getCanvas(): HTMLCanvasElement | null {
    return document.querySelector<HTMLCanvasElement>(".cursor-canvas");
  }

  function onResize() {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const canvas = getCanvas();
    if (canvas) {
      canvas.width = dimensions().width;
      canvas.height = dimensions().height;
    }
  }

  const maxMouthAngle = Math.PI / 6; // 吃豆人张嘴的最大角度

  function render() {
    const canvas = getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newPacman = { ...pacman() };
    newPacman.lastX = lerp(pacman().lastX, mousePosition().x, 0.1);
    newPacman.lastY = lerp(pacman().lastY, mousePosition().y, 0.1);
    setPacman(newPacman);

    const angleToCursor = Math.atan2(
      mousePosition().y - newPacman.lastY,
      mousePosition().x - newPacman.lastX
    );
    const mouthOpen = Math.abs(Math.sin(Date.now() * 0.01)) * maxMouthAngle;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(
      newPacman.lastX,
      newPacman.lastY,
      isHovered()
        ? newPacman.radius * 2
        : newPacman.radius,
      0,
      Math.PI * 2,
      false
    );
    ctx.fillStyle = "#f7d46c";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(newPacman.lastX, newPacman.lastY);
    ctx.arc(
      newPacman.lastX,
      newPacman.lastY,
      isHovered() ? newPacman.radius * 2 : newPacman.radius,
      angleToCursor - mouthOpen,
      angleToCursor + mouthOpen,
      false
    );
    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();

    requestAnimationFrame(render);
  }

  function lerp(a: number, b: number, n: number): number {
    return (1 - n) * a + n * b;
  }

  onMount(() => {
    const canvas = getCanvas();
    if (canvas) {
      canvas.width = dimensions().width;
      canvas.height = dimensions().height;
    }

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(document.body);

    window.addEventListener("mousemove", (e) => {
      setMousePosition({ x: e.pageX, y: e.pageY });
    });

    const hoverableElements = document.querySelectorAll("[data-hover]");
    hoverableElements.forEach((elem) => {
      elem.addEventListener("mouseenter", () => setIsHovered(true));
      elem.addEventListener("mouseleave", () => setIsHovered(false));
    });

    requestAnimationFrame(render);

    onCleanup(() => {
      window.removeEventListener("mousemove", (e) => {
        setMousePosition({ x: e.pageX, y: e.pageY });
      });
      resizeObserver.disconnect();
      hoverableElements.forEach((elem) => {
        elem.removeEventListener("mouseenter", () => setIsHovered(true));
        elem.removeEventListener("mouseleave", () => setIsHovered(false));
      });
    });
  });

  return (
    <canvas class="cursor-canvas absolute top-0 left-0 p-0 m-0 z-3 pointer-events-none mix-blend-difference" />
  );
}
