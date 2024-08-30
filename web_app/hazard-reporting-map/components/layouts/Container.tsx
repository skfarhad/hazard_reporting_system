import React from "react";

type TProps = {
  children: React.ReactNode;
};
export default function Container({ children }: TProps) {
  return <div className="max-w-[1460px] mx-auto px-6">{children}</div>;
}
