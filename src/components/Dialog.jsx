import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from "prop-types";
import {useDialog} from "../hooks/useDialog";

const Dialog = ({onClose, className, children, ...props}) => {
  const refDialog = useDialog(onClose);

  const classList = ['dialog__body'];
  if (className) {
    classList.push(className);
  }

  const dialog = (
    <div {...props} ref={refDialog} className={classList.join(' ')}>
      {children}
    </div>
  );

  return ReactDOM.createPortal(dialog, document.body);
};

Dialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Dialog;
