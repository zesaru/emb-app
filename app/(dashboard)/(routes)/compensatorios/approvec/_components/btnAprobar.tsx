import React, { FunctionComponent } from "react";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: FunctionComponent<Props> = ({ children, onClick }) => {
  return (
    <button
      onClick={() => {
        onClick && onClick();
      }}
      className="px-3 py-2 bg-blue-400 rounded-lg text-white"
    >
      {children}
    </button>
  );
};

export default Button;
