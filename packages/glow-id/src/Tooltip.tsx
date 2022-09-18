import { arrow } from "@floating-ui/react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useHover,
  useFloating,
  useInteractions,
  useFocus,
  useRole,
  useDismiss,
} from "@floating-ui/react-dom-interactions";
import React, { cloneElement, useRef, useState } from "react";
import styled from "styled-components";

export const Tooltip = ({
  children,
  tooltip,
}: {
  children: JSX.Element;
  tooltip: React.ReactNode;
}) => {
  const arrowRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { context, x, y, strategy, middlewareData, floating, reference } =
    useFloating({
      placement: "top",
      onOpenChange: setOpen,
      middleware: [arrow({ element: arrowRef })],
    });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { restMs: 0 }),
    useFocus(context),
    useRole(context, { role: "tooltip" }),
    useDismiss(context),
  ]);

  const { x: arrowX, y: arrowY } = middlewareData.arrow || {};

  return (
    <>
      {cloneElement(
        children,
        getReferenceProps({ ref: reference, ...children.props })
      )}

      <AnimatePresence>
        {open && (
          <TooltipContainer
            as={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              opacity: FRAMER_TRANSITION,
              scale: FRAMER_BOUNCE_TRANSITION,
            }}
            style={{
              position: strategy,
              top: (y ?? 0) - 6,
              left: x ?? 0,
            }}
            ref={floating}
            {...getFloatingProps()}
          >
            {tooltip}

            <TooltipArrow
              ref={arrowRef}
              style={{
                left: arrowX,
                bottom: "-0.25rem",
              }}
            />
          </TooltipContainer>
        )}
      </AnimatePresence>
    </>
  );
};

const FRAMER_EASE = [0.4, 0, 0.2, 1];
const FRAMER_TRANSITION = { ease: FRAMER_EASE, duration: 0.3 };
const FRAMER_BOUNCE_EASE = [0.54, 1.12, 0.38, 1.11];
const FRAMER_BOUNCE_TRANSITION = {
  ease: FRAMER_BOUNCE_EASE,
  duration: 0.3,
};

const TooltipContainer = styled.div`
  box-shadow: 0 1.6px 2.7px rgba(0, 0, 0, 0.02),
    0 4.2px 6.9px rgba(0, 0, 0, 0.03), 0 8.5px 14.2px rgba(0, 0, 0, 0.04),
    0 17.5px 29.2px rgba(0, 0, 0, 0.05), 0 48px 80px rgba(0, 0, 0, 0.06);
  background: lightgray;
  border-radius: 0.25rem;
  padding: 0.5rem;
`;

const TooltipArrow = styled.div`
  background: lightgray;
  position: absolute;
  transform: rotate(45deg);
  width: 0.5rem;
  height: 0.5rem;
`;
