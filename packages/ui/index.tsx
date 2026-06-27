import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass";
  children: React.ReactNode;
}

export const Button = ({ variant = "primary", children, className, ...props }: ButtonProps) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500";
  
  const variants = {
    primary: "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_15px_rgba(0,229,255,0.4)]",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    glass: "bg-slate-900/40 backdrop-blur-md hover:bg-slate-900/60 text-cyan-400 border border-cyan-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
};
