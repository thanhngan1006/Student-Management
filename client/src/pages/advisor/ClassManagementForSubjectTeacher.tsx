import axios from "axios";
import { useEffect, useState } from "react";
import { FaInfoCircle, FaSearch } from "react-icons/fa";
import { RiExportFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

// Định nghĩa URL từ env vars
const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;
const SCORE_SERVICE_URL = import.meta.env.VITE_SCORE_SERVICE_URL;

const ClassManagementForSubjectTeacher = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const classesRes = await axios.get(
          `${CLASS_SERVICE_URL}/api/teacher/tdt/${user.tdt_id}`, // Thay thế
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClasses(classesRes.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách lớp:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.tdt_id) {
      fetchTeacherClasses();
    }
  }, [user?.tdt_id]);

  const fetchSemesters = async (classId: string) => {
    try {
      const res = await axios.get(
        `${CLASS_SERVICE_URL}/${classId}/available-semesters`, // Thay thế
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const newSemesters = res.data.semesters || [];
      setSemesters(newSemesters);

      if (newSemesters.length > 0 && !selectedSemester) {
        setSelectedSemester(newSemesters[0]._id);
      } else if (newSemesters.length > 0 && selectedSemester) {
        const isValidSemester = newSemesters.some(
          (sem: any) => sem._id === selectedSemester
        );
        if (!isValidSemester) {
          setSelectedSemester(newSemesters[0]._id);
        }
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách kỳ học:", err);
      setSemesters([]);
      setSelectedSemester("");
    }
  };

  const fetchStudentsByClass = async (classId: string) => {
    try {
      setSelectedClass(classId);
      setSelectedSemester("");
      setSemesters([]);

      if (!classId) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      await fetchSemesters(classId);

      const classRes = await axios.get(
        `${CLASS_SERVICE_URL}/api/classes/${classId}/students`, // Thay thế
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const studentIds = classRes.data?.students.map((s: any) => s._id);

      if (studentIds.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        return;
      }

      const usersRes = await axios.post(
        `${USER_SERVICE_URL}/api/users/batch`, // Thay thế
        { ids: studentIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const enrichedStudents = await Promise.all(
        usersRes.data.map(async (student: any) => {
          try {
            const scoreRes = await axios.get(
              `${SCORE_SERVICE_URL}/api/students/${student._id}/scores`, // Thay thế
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return {
              ...student,
              class_id: classId,
              ...scoreRes.data,
            };
          } catch {
            return {
              ...student,
              class_id: classId,
              gpa: "-",
              status: "Chưa có",
            };
          }
        })
      );

      setStudents(enrichedStudents);
      setFilteredStudents(enrichedStudents);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách học sinh:", err);
      setStudents([]);
      setFilteredStudents([]);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedClass) {
      alert("Vui lòng chọn một lớp để xuất điểm!");
      return;
    }
    if (!selectedSemester) {
      alert("Vui lòng chọn một kỳ học để xuất điểm!");
      return;
    }

    setExportLoading(true);
    try {
      const response = await axios.get(
        `${SCORE_SERVICE_URL}/api/students/export/pdf/subject`, // Thay thế
        {
          params: {
            classId: selectedClass,
            semesterId: selectedSemester,
            teacherId: user.tdt_id,
          },
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `subject-score.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Lỗi khi xuất PDF:", err);
      alert("Không thể xuất bảng điểm. Vui lòng thử lại!");
    } finally {
      setExportLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.tdt_id?.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  };

  const handleViewDetails = (studentId: string) => {
    navigate(`/advisor/classForSubjectTeacher/${selectedClass}/${studentId}`);
  };

  if (loading) return <div className="p-6">Đang tải danh sách lớp học...</div>;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý lớp học</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <select
          className="px-4 py-2 border rounded-md"
          value={selectedClass}
          onChange={(e) => fetchStudentsByClass(e.target.value)}
        >
          <option value="">Chọn lớp</option>
          {classes.map((cls) => (
            <option key={cls.class_id} value={cls.class_id}>
              {cls.class_id} - {cls.class_name}
            </option>
          ))}
        </select>

        {selectedClass && (
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã định danh..."
              className="w-full px-4 py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearch}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        )}

        {selectedClass && (
          <select
            className="px-4 py-2 border rounded-md"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            disabled={semesters.length === 0}
          >
            {semesters.length === 0 ? (
              <option value="">Chưa có kỳ học</option>
            ) : (
              <>
                <option value="">Chọn kỳ học</option>
                {semesters.map((sem) => (
                  <option key={sem._id} value={sem._id}>
                    {sem.semester_name}
                  </option>
                ))}
              </>
            )}
          </select>
        )}

        {selectedClass && (
          <button
            className={`px-4 py-2 rounded-md cursor-pointer flex items-center gap-2 ${
              exportLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
            onClick={handleExportPdf}
            disabled={exportLoading}
          >
            <RiExportFill />
            {exportLoading ? "Đang xuất..." : "Xuất PDF"}
          </button>
        )}
      </div>

      {selectedClass && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-3 px-4 text-left">Họ và tên</th>
                <th className="py-3 px-4 text-left">Mã định danh</th>
                <th className="py-3 px-4 text-left">Ngày sinh</th>
                <th className="py-3 px-4 text-center">Chi tiết điểm</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student._id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{student.name}</td>
                  <td className="py-3 px-4">{student.tdt_id}</td>
                  <td className="py-3 px-4">
                    {new Date(student.date_of_birth).toLocaleDateString(
                      "vi-VN"
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => handleViewDetails(student.tdt_id)}
                    >
                      <FaInfoCircle size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassManagementForSubjectTeacher;
