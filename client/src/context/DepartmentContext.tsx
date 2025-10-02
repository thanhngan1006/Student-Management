import { createContext, useContext, useState } from "react";
import Swal from "sweetalert2";
import { mockTeachers } from "../data/mockTeachers";

interface DepartmentTeacher {
  teacher: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
  subject: string;
  departmentId: number;
}

interface DepartmentContextType {
  addDepartmentTeacher: (
    email: string,
    subject: string,
    departmentId: number
  ) => void;
  removeDepartmentTeacher: (teacherId: string, departmentId: number) => void;
  searchDepartmentTeachers: (
    searchTerm: string,
    departmentId: number
  ) => DepartmentTeacher[];
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(
  undefined
);

export const DepartmentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [departmentTeachers, setDepartmentTeachers] = useState<
    DepartmentTeacher[]
  >([]);

  const addDepartmentTeacher = (
    email: string,
    subject: string,
    departmentId: number
  ) => {
    if (!email || !subject) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập đầy đủ email và môn dạy của giáo viên",
      });
      return;
    }

    const existingTeacher = mockTeachers.find(
      (teacher) => teacher.email === email || teacher.phone_number === email
    );

    if (!existingTeacher) {
      Swal.fire({
        icon: "error",
        title: "Không tìm thấy giáo viên",
        text: "Giáo viên không tồn tại trong hệ thống",
      });
      return;
    }

    const isTeacherExistAnywhere = departmentTeachers.some(
      (dt) => dt.teacher.id === existingTeacher.id
    );

    if (isTeacherExistAnywhere) {
      Swal.fire({
        icon: "warning",
        title: "Giáo viên đã tồn tại",
        text: "Giáo viên này đã được phân công dạy môn khác",
      });
      return;
    }

    const newDepartmentTeacher: DepartmentTeacher = {
      teacher: existingTeacher,
      subject,
      departmentId,
    };

    setDepartmentTeachers([...departmentTeachers, newDepartmentTeacher]);

    Swal.fire({
      icon: "success",
      title: "Thành công",
      text: "Đã thêm giáo viên vào tổ bộ môn!",
    });
  };

  const removeDepartmentTeacher = (teacherId: string, departmentId: number) => {
    setDepartmentTeachers(
      departmentTeachers.filter(
        (dt) =>
          !(dt.teacher.id === teacherId && dt.departmentId === departmentId)
      )
    );
  };

  const searchDepartmentTeachers = (
    searchTerm: string,
    departmentId: number
  ) => {
    return departmentTeachers
      .filter((dt) => dt.departmentId === departmentId)
      .filter(
        (dt) =>
          dt.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dt.teacher.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dt.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dt.teacher.phone_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
  };

  return (
    <DepartmentContext.Provider
      value={{
        addDepartmentTeacher,
        removeDepartmentTeacher,
        searchDepartmentTeachers,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartment must be used within a DepartmentProvider");
  }
  return context;
};
