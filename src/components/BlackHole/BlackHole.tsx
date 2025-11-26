import { onCleanup, onMount, createSignal, createEffect } from "solid-js";
// @ts-ignore
import { createBlackHole } from './BlackHole.js'

export default function Cursor() {
  let container: HTMLDivElement | undefined;

  onMount(() => {
    const b = createBlackHole(container);
    console.log('b: ', b)
  });

  return (
    <div ref={container} id="blackhole" class="fixed top-0 left-0 w-screen h-screen z-0"></div>
  );
}
