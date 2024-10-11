import React, { ReactNode } from "react";
import { Input, InputProps } from "./input";
import { Button } from "./button";
import { IconType } from "react-icons";

type TProps = {
  buttonNode: ReactNode;
} & InputProps;

export default function InputWithButton({
  buttonNode = "ok",
  ...inputProps
}: TProps) {
  return (
    <div className="flex bg-card  rounded-md shadow-sm items-center gap-1">
      <Input className="px-4  border-none" {...inputProps} />
      <Button className="h-[40px] rounded-l-none">{buttonNode}</Button>
    </div>
  );
}
