import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { useDialog } from "../hooks/useDialog";

interface DialogProps {
  onClose: () => void;
  className?: string;
  children?: ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ onClose, className, children, ...props }) => {
  const refDialog = useDialog(onClose);

  const classList = ['dialog__body'];
  if (className) {
    classList.push(className);
  }

  const dialog = (
    <div {...props} ref={refDialog} className={classList.join(' ')} role="dialog" aria-modal="true">
      {children}
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
};

export default Dialog;
