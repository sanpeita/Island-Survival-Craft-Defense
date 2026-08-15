import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  onAttack: (pressed: boolean) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, onAttack }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [activeTouchId, setActiveTouchId] = useState<number | null>(null);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const maxRadius = 42;

  // Keyboard controls listener (WASD / Arrow keys)
  useEffect(() => {
    const keysPressed = new Set<string>();

    const updateFromKeys = () => {
      let x = 0;
      let y = 0;
      if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) y -= 1;
      if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) y += 1;
      if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) x -= 1;
      if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) x += 1;

      const len = Math.hypot(x, y);
      if (len > 0) {
        x /= len;
        y /= len;
      }
      onMove({ x, y });
      setKnobPos({ x: x * 32, y: y * 32 });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keysPressed.add(e.code);
        updateFromKeys();
      }
      if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'KeyE') {
        onAttack(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysPressed.has(e.code)) {
        keysPressed.delete(e.code);
        updateFromKeys();
      }
      if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'KeyE') {
        onAttack(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, onAttack]);

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove({
      x: dx / maxRadius,
      y: dy / maxRadius,
    });
  }, [maxRadius, onMove]);

  // Touch Handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (activeTouchId !== null) return;
      const touch = e.changedTouches[0];
      setActiveTouchId(touch.identifier);
      updateJoystick(touch.clientX, touch.clientY);
    },
    [activeTouchId, updateJoystick]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    },
    [activeTouchId, updateJoystick]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          setActiveTouchId(null);
          setKnobPos({ x: 0, y: 0 });
          onMove({ x: 0, y: 0 });
          break;
        }
      }
    },
    [activeTouchId, onMove]
  );

  // Mouse / Pointer fallback
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return; // Handled by touch events
    setIsPointerActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerActive || e.pointerType === 'touch') return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerActive || e.pointerType === 'touch') return;
    setIsPointerActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  };

  return (
    <div
      id="virtual-joystick-container"
      ref={joystickRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[#333] bg-[#0c0c0c]/85 backdrop-blur-md shadow-2xl flex items-center justify-center select-none touch-none cursor-grab active:cursor-grabbing"
    >
      {/* Outer Ring guide */}
      <div className="absolute inset-2 rounded-full border border-dashed border-[#444]/60 pointer-events-none" />

      {/* Direction Cross Accents */}
      <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40 pointer-events-none" />
      <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40 pointer-events-none" />
      <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40 pointer-events-none" />
      <div className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/40 pointer-events-none" />

      {/* Inner Obsidian / Bronze Knob */}
      <div
        id="virtual-joystick-knob"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1c1c1c] border-2 border-amber-600/70 shadow-[0_0_15px_rgba(217,119,6,0.3)] flex items-center justify-center pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 shadow-inner" />
      </div>
    </div>
  );
};
