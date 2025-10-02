import React, { createContext, ReactNode, useContext, useState } from "react";
import { mockListStudents } from "../data/mockListStudent";
// import { v4 as uuidv4 } from "uuid";

type StudentInfoContextType = {
  handleDelete: (tdtId: string) => void;
  handleEdit: (student: any) => void;
  handleUpdate: (e: React.FormEvent) => void;
  handleAdd: (newStudent: any) => void;
  students: any[];
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  editingStudent: any;
  setEditingStudent: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StudentInfoContext = createContext<
  StudentInfoContextType | undefined
>(undefined);

type StudentInfoProviderProps = {
  children: ReactNode;
};

export const StudentInfoProvider = ({ children }: StudentInfoProviderProps) => {
  const [students, setStudents] = useState(mockListStudents);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = (newStudent: any) => {
    setStudents([...students, newStudent]);
  };

  const handleDelete = (tdtId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này?")) {
      setStudents(students.filter((student) => student.tdt_id !== tdtId));
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsEditing(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setStudents(
      students.map((student) =>
        student.tdt_id === editingStudent.tdt_id ? editingStudent : student
      )
    );
    setIsEditing(false);
    setEditingStudent(null);
  };

  return (
    <StudentInfoContext.Provider
      value={{
        handleAdd,
        handleDelete,
        handleEdit,
        handleUpdate,
        students,
        setStudents,
        editingStudent,
        setEditingStudent,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </StudentInfoContext.Provider>
  );
};

export const useStudentInfo = () => {
  const context = useContext(StudentInfoContext);
  if (!context) {
    throw new Error("useStudentInfo must be used within a StudentInfoProvider");
  }
  return context;
};
