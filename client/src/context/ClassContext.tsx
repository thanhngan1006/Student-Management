import axios from "axios";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Swal from "sweetalert2";
import { ClassTypes } from "../types/class";

type ClassContext = {
  classes: ClassTypes[];
  handleAddClass: (newClass: ClassTypes) => void;
  isFormVisible: boolean;
  setIsFormVisible: (visible: boolean) => void;
  error: string;
  setError: (error: string) => void;
  handleCreateClass: () => void;
  studentClass: ClassTypes | undefined;
  setStudentClass: (studentClass: ClassTypes) => void;
  handleClassNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddAdvisor: (email: string) => void;
  handleEditAdvisor: (email: string) => void;
  advisor: string | null;
};

export const ClassContext = createContext<ClassContext | undefined>(undefined);

type ClassProviderProps = {
  children: ReactNode;
};

export const ClassProvider = ({ children }: ClassProviderProps) => {
  const [classes, setClasses] = useState<ClassTypes[]>([]);
  const [studentClass, setStudentClass] = useState<ClassTypes>({
    class_id: "",
    class_name: "",
    class_teacher: "",
    class_member: [],
    updatedAt: new Date().toISOString(),
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState("");
  const [advisor, setAdvisor] = useState<string | null>(null);
  const [newAdvisorEmail, setNewAdvisorEmail] = useState("");

  const generateRandomID = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  const handleClassNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentClass(
      (prev: ClassTypes) =>
        ({
          ...prev,
          class_id: e.target.value,
        } as ClassTypes)
    );
  };

  const handleCreateClass = async () => {
    if (!studentClass?.class_id.trim()) {
      setError("Mã lớp không được để trống!");
      return;
    }
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:4000/api/classes",
        {
          class_id: studentClass.class_id.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdClass = res.data.class;

      handleAddClass(createdClass);

      setStudentClass((prev) => ({
        ...prev,
        class_id: "",
      }));
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Lớp đã được tạo thành công!",
      });
      setIsFormVisible(false);
    } catch (err: any) {
      let msg = "Đã có lỗi xảy ra!";
      if (err.response?.status === 409) {
        msg = "Lớp đã tồn tại!";
      }

      Swal.fire({
        icon: "error",
        title: "Thất bại!",
        text: msg,
      });
    }
  };

  const handleAddClass = (newClass: ClassTypes) => {
    setClasses([...classes, newClass]);
  };

  const handleAddAdvisor = (email: string) => {
    setAdvisor(email);
    console.log("Thêm giáo viên với email:", email);
    setNewAdvisorEmail("");
  };

  const handleEditAdvisor = (email: string) => {
    setAdvisor(email);
    console.log("Chỉnh sửa giáo viên với email:", email);
    setNewAdvisorEmail("");
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/classes"); // hoặc URL tương ứng
        setClasses(res.data);
      } catch (err) {
        console.error("Lỗi khi fetch lớp học:", err);
      }
    };

    fetchClasses();
  }, []);

  return (
    <ClassContext.Provider
      value={{
        handleEditAdvisor,
        handleClassNameChange,
        studentClass,
        setStudentClass,
        classes,
        handleAddClass,
        isFormVisible,
        setIsFormVisible,
        error,
        setError,
        handleCreateClass,
        handleAddAdvisor, // Cung cấp hàm thêm giáo viên
        advisor, // Cung cấp trạng thái giáo viên
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClass must be used within a ClassProvider");
  }
  return context;
};
