import React, { createContext, ReactNode, useContext, useState } from "react";
import { mockAdvisors } from "../data/mockAdvisors";

type AdvisorInfoContextType = {
  handleDelete: (tdtId: string) => void;
  handleEdit: (advisor: any) => void;
  handleUpdate: (e: React.FormEvent) => void;
  handleAdd: (newAdvisor: any) => void;
  advisors: any[];
  setAdvisors: React.Dispatch<React.SetStateAction<any[]>>;
  editingAdvisor: any;
  setEditingAdvisor: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

export const AdvisorInfoContext = createContext<
  AdvisorInfoContextType | undefined
>(undefined);

type AdvisorInfoProviderProps = {
  children: ReactNode;
};

export const AdvisorInfoProvider = ({ children }: AdvisorInfoProviderProps) => {
  const [advisors, setAdvisors] = useState(mockAdvisors);
  const [editingAdvisor, setEditingAdvisor] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = (newAdvisor: any) => {
    setAdvisors([...advisors, newAdvisor]);
  };

  const handleDelete = (tdtId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa giáo viên này?")) {
      setAdvisors(advisors.filter((advisor) => advisor.tdt_id !== tdtId));
    }
  };

  const handleEdit = (advisor: any) => {
    setEditingAdvisor(advisor);
    setIsEditing(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setAdvisors(
      advisors.map((advisor) =>
        advisor.tdt_id === editingAdvisor.tdt_id ? editingAdvisor : advisor
      )
    );
    setIsEditing(false);
    setEditingAdvisor(null);
  };

  return (
    <AdvisorInfoContext.Provider
      value={{
        handleAdd,
        handleDelete,
        handleEdit,
        handleUpdate,
        advisors,
        setAdvisors,
        editingAdvisor,
        setEditingAdvisor,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </AdvisorInfoContext.Provider>
  );
};

export const useAdvisorInfo = () => {
  const context = useContext(AdvisorInfoContext);
  if (!context) {
    throw new Error("useAdvisorInfo must be used within a AdvisorInfoProvider");
  }
  return context;
};
