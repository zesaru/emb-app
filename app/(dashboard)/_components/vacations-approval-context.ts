"use client";

import { createContext, type Dispatch, type SetStateAction } from "react";

export const VacationsApprovalContext = createContext<{
  isApproving: boolean;
  setIsApproving: Dispatch<SetStateAction<boolean>>;
} | null>(null);
