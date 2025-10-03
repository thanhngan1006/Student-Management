// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { FaSearch } from "react-icons/fa";

// const TeacherDashboard = () => {
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user") || "{}");
//   const [classData, setClassData] = useState({ class_id: "", class_name: "", students: [] });
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [originalStudents, setOriginalStudents] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [schoolYears, setSchoolYears] = useState([]);
//   const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
//   const [semesterIds, setSemesterIds] = useState({ hk1: "", hk2: "" });
//   const [snackbar, setSnackbar] = useState({ open: false, message: "" });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   // Fetch school years
//   useEffect(() => {
//     const fetchSchoolYears = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         if (!token) {
//           throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
//         }
//         const response = await axios.get("http://localhost:4001/api/semesters/school-years", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         const years = response.data;
//         setSchoolYears(years);
//         if (years.length > 0) {
//           setSelectedSchoolYear(years[0]); // Default to the first (newest) year
//         } else {
//           setError("Không có năm học nào để hiển thị.");
//         }
//       } catch (err) {
//         setError(err.response?.data?.message || "Lỗi khi lấy danh sách năm học.");
//         console.error("Lỗi khi lấy năm học:", err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSchoolYears();
//   }, [token]);

//   // Fetch class, students, semesters, and scores when school year changes
//   useEffect(() => {
//     const fetchData = async () => {
//       if (!selectedSchoolYear) return;

//       setLoading(true);
//       setError("");
//       try {
//         if (!token || !user._id) {
//           throw new Error("Không tìm thấy token hoặc ID người dùng. Vui lòng đăng nhập lại.");
//         }

//         // Fetch class data
//         const classRes = await axios.get(
//           `http://localhost:4000/api/teachers/${user._id}/class`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const { class_id, class_name, students } = classRes.data.class;
//         setClassData({ class_id, class_name, students });

//         if (!students || students.length === 0) {
//           setOriginalStudents([]);
//           setFilteredStudents([]);
//           setSemesterIds({ hk1: "", hk2: "" });
//           return;
//         }

//         // Fetch semesters for the selected school year
//         const semesterRes = await axios.get(
//           `http://localhost:4001/api/semesters?school_year=${selectedSchoolYear}`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const semesters = semesterRes.data;
//         const hk1Semester = semesters.find((s) => s.semester_name.includes("HK1"));
//         const hk2Semester = semesters.find((s) => s.semester_name.includes("HK2"));
//         if (!hk1Semester && !hk2Semester) {
//           throw new Error("Không tìm thấy kỳ học nào cho năm học này.");
//         }
//         const newSemesterIds = {
//           hk1: hk1Semester?._id || "",
//           hk2: hk2Semester?._id || ""
//         };
//         setSemesterIds(newSemesterIds);

//         // Fetch student details
//         const usersRes = await axios.post(
//           "http://localhost:4003/api/users/batch",
//           { ids: students },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         const studentDetails = usersRes.data;

//         // Fetch scores for each student using getStatusAndBehavior API
//         const enrichedStudents = await Promise.all(
//           studentDetails.map(async (student) => {
//             try {
//               if (!newSemesterIds.hk1 && !newSemesterIds.hk2) {
//                 return {
//                   ...student,
//                   hk1_gpa: "N/A",
//                   hk1_behavior: "N/A",
//                   hk2_gpa: "N/A",
//                   hk2_behavior: "N/A",
//                   avg_gpa: "N/A"
//                 };
//               }

//               const semesterIdsParam = [newSemesterIds.hk1, newSemesterIds.hk2]
//                 .filter((id) => id)
//                 .join(",");
//               if (!semesterIdsParam) {
//                 return {
//                   ...student,
//                   hk1_gpa: "N/A",
//                   hk1_behavior: "N/A",
//                   hk2_gpa: "N/A",
//                   hk2_behavior: "N/A",
//                   avg_gpa: "N/A"
//                 };
//               }

//               const scoresRes = await axios.get(
//                 `http://localhost:4002/api/students/status-behavior?user_id=${student._id}&semester_ids=${semesterIdsParam}`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//               );
//               const scores = scoresRes.data;

//               const hk1Score = scores.find((s) => s.semester_id === newSemesterIds.hk1) || {
//                 gpa: "N/A",
//                 behavior: "N/A"
//               };
//               const hk2Score = scores.find((s) => s.semester_id === newSemesterIds.hk2) || {
//                 gpa: "N/A",
//                 behavior: "N/A"
//               };

//               const hk1Gpa = hk1Score.gpa !== "N/A" ? parseFloat(hk1Score.gpa) : null;
//               const hk2Gpa = hk2Score.gpa !== "N/A" ? parseFloat(hk2Score.gpa) : null;
//               const avgGpa =
//                 hk1Gpa && hk2Gpa
//                   ? ((hk1Gpa + hk2Gpa) / 2).toFixed(2)
//                   : hk1Gpa
//                   ? hk1Gpa.toFixed(2)
//                   : hk2Gpa
//                   ? hk2Gpa.toFixed(2)
//                   : "N/A";

//               return {
//                 ...student,
//                 hk1_gpa: hk1Score.gpa,
//                 hk1_behavior: hk1Score.behavior,
//                 hk2_gpa: hk2Score.gpa,
//                 hk2_behavior: hk2Score.behavior,
//                 avg_gpa: avgGpa
//               };
//             } catch (err) {
//               console.error(`Lỗi khi lấy điểm cho học sinh ${student._id}:`, err.message);
//               return {
//                 ...student,
//                 hk1_gpa: "N/A",
//                 hk1_behavior: "N/A",
//                 hk2_gpa: "N/A",
//                 hk2_behavior: "N/A",
//                 avg_gpa: "N/A"
//               };
//             }
//           })
//         );

//         setOriginalStudents(enrichedStudents);
//         setFilteredStudents(enrichedStudents);
//       } catch (err) {
//         setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu. Vui lòng thử lại.");
//         console.error("Lỗi khi tải dữ liệu:", err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [token, user._id, selectedSchoolYear]);

//   const handleSearch = (e) => {
//     const term = e.target.value.toLowerCase();
//     setSearchTerm(term);
//     const result = originalStudents.filter(
//       (s) =>
//         s.name.toLowerCase().includes(term) ||
//         s.tdt_id.toLowerCase().includes(term)
//     );
//     setFilteredStudents(result);
//   };

//   const handleSendForApproval = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       if (!token) {
//         throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
//       }
//       if (!classData.students.length) {
//         throw new Error("Không có học sinh để gửi duyệt.");
//       }
//       if (!selectedSchoolYear) {
//         throw new Error("Vui lòng chọn năm học trước khi gửi duyệt.");
//       }

//       const submission = {
//         class_id: classData.class_id,
//         class_name: classData.class_name,
//         school_year: selectedSchoolYear,
//         students: filteredStudents.map((s) => ({
//           student_id: s._id,
//           name: s.name,
//           hk1: { gpa: s.hk1_gpa === "N/A" ? null : parseFloat(s.hk1_gpa), behavior: s.hk1_behavior },
//           hk2: { gpa: s.hk2_gpa === "N/A" ? null : parseFloat(s.hk2_gpa), behavior: s.hk2_behavior }
//         })).filter((s) => s.hk1.gpa !== null || s.hk2.gpa !== null) // Remove students with no scores
//       };

//       if (submission.students.length === 0) {
//         throw new Error("Không có học sinh nào có dữ liệu điểm để gửi duyệt.");
//       }

//       const response = await axios.post(
//         "http://localhost:4000/api/approvals/submit",
//         submission,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setSnackbar({ open: true, message: `Đã gửi danh sách để duyệt. ID: ${response.data.approvalId}` });
//     } catch (err) {
//       setError(err.response?.data?.message || "Lỗi khi gửi duyệt. Vui lòng thử lại.");
//       console.error("Lỗi khi gửi duyệt:", err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="p-6">Đang tải danh sách học sinh...</div>;
//   }

//   return (
//     <div className="p-6 h-full overflow-y-auto">
//       <h1 className="text-2xl font-bold mb-6">Bảng điểm học sinh</h1>

//       {error && (
//         <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-md">
//           {error}
//         </div>
//       )}

//       <div className="mb-6 flex flex-col md:flex-row gap-4">
//         <select
//           className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           value={selectedSchoolYear}
//           onChange={(e) => setSelectedSchoolYear(e.target.value)}
//         >
//           <option value="">Chọn năm học</option>
//           {schoolYears.map((year) => (
//             <option key={year} value={year}>
//               {year}
//             </option>
//           ))}
//         </select>
//         <div className="relative flex-grow">
//           <input
//             type="text"
//             placeholder="Tìm kiếm theo tên hoặc mã định danh..."
//             className="w-full px-4 py-2 pl-10 pr-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={searchTerm}
//             onChange={handleSearch}
//           />
//           <FaSearch className="absolute left-3 top-3 text-gray-400" />
//         </div>
//         <button
//           className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
//           onClick={handleSendForApproval}
//           disabled={loading || !selectedSchoolYear}
//         >
//           {loading ? "Đang gửi..." : "Gửi duyệt"}
//         </button>
//       </div>

//       <div className="overflow-x-auto rounded-lg shadow">
//         <table className="min-w-full bg-white">
//           <thead>
//             <tr className="bg-gray-100 text-gray-700">
//               <th className="py-3 px-4 text-left">Họ và tên</th>
//               <th className="py-3 px-4 text-left">Lớp</th>
//               <th className="py-3 px-4 text-left">Mã định danh</th>
//               <th className="py-3 px-4 text-left">Điểm HK1</th>
//               <th className="py-3 px-4 text-left">Hạnh kiểm HK1</th>
//               <th className="py-3 px-4 text-left">Điểm HK2</th>
//               <th className="py-3 px-4 text-left">Hạnh kiểm HK2</th>
//               <th className="py-3 px-4 text-center">Điểm trung bình</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredStudents.length === 0 ? (
//               <tr>
//                 <td colSpan="8" className="py-3 px-4 text-center text-gray-500">
//                   Không có học sinh nào để hiển thị.
//                 </td>
//               </tr>
//             ) : (
//               filteredStudents.map((student) => (
//                 <tr key={student._id} className="border-t hover:bg-gray-50">
//                   <td className="py-3 px-4">{student.name}</td>
//                   <td className="py-3 px-4">{classData.class_id}</td>
//                   <td className="py-3 px-4">{student.tdt_id}</td>
//                   <td className="py-3 px-4">{student.hk1_gpa}</td>
//                   <td className="py-3 px-4">{student.hk1_behavior}</td>
//                   <td className="py-3 px-4">{student.hk2_gpa}</td>
//                   <td className="py-3 px-4">{student.hk2_behavior}</td>
//                   <td className="py-3 px-4 text-center">{student.avg_gpa}</td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {snackbar.open && (
//         <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
//           {snackbar.message}
//           <button
//             className="ml-4 text-white"
//             onClick={() => setSnackbar({ open: false, message: "" })}
//           >
//             ×
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeacherDashboard;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

// Định nghĩa kiểu dữ liệu
interface Student {
  _id: string;
  name: string;
  tdt_id: string;
  hk1_gpa: string | number; // Cho phép cả string ("N/A") và number
  hk1_behavior: string;
  hk2_gpa: string | number; // Cho phép cả string ("N/A") và number
  hk2_behavior: string;
  avg_gpa: string | number; // Cho phép cả string ("N/A") và number
}

interface ClassData {
  class_id: string;
  class_name: string;
  students: string[]; // Mảng ID học sinh
}

interface Semester {
  _id: string;
  semester_name: string;
}

interface Score {
  semester_id: string;
  gpa: string; // API trả về string, ví dụ: "7.5" hoặc "N/A"
  behavior: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
}

const TeacherDashboard: React.FC = () => {
  const token = localStorage.getItem("token") || "";
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [classData, setClassData] = useState<ClassData>({
    class_id: "",
    class_name: "",
    students: [],
  });
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [semesterIds, setSemesterIds] = useState<{ hk1: string; hk2: string }>({
    hk1: "",
    hk2: "",
  });
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch school years
  useEffect(() => {
    const fetchSchoolYears = async () => {
      console.log(semesterIds);

      setLoading(true);
      setError("");
      try {
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }
        const response = await axios.get<string[]>(
          "http://localhost:4001/api/semesters/school-years",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const years = response.data;
        setSchoolYears(years);
        if (years.length > 0) {
          setSelectedSchoolYear(years[0]); // Default to the first (newest) year
        } else {
          setError("Không có năm học nào để hiển thị.");
        }
      } catch (err) {
        const errorMessage =
          (err as Error)?.message || "Lỗi khi lấy danh sách năm học.";
        setError(errorMessage);
        console.error("Lỗi khi lấy năm học:", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolYears();
  }, [token]);

  // Fetch class, students, semesters, and scores when school year changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSchoolYear) return;

      setLoading(true);
      setError("");
      try {
        if (!token || !user._id) {
          throw new Error(
            "Không tìm thấy token hoặc ID người dùng. Vui lòng đăng nhập lại."
          );
        }

        // Fetch class data
        const classRes = await axios.get<{ class: ClassData }>(
          `http://localhost:4000/api/teachers/${user._id}/class`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { class_id, class_name, students } = classRes.data.class;
        setClassData({ class_id, class_name, students });

        if (!students || students.length === 0) {
          setOriginalStudents([]);
          setFilteredStudents([]);
          setSemesterIds({ hk1: "", hk2: "" });
          return;
        }

        // Fetch semesters for the selected school year
        const semesterRes = await axios.get<Semester[]>(
          `http://localhost:4001/api/semesters?school_year=${selectedSchoolYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const semesters = semesterRes.data;
        const hk1Semester = semesters.find((s: Semester) =>
          s.semester_name.includes("HK1")
        );
        const hk2Semester = semesters.find((s: Semester) =>
          s.semester_name.includes("HK2")
        );
        if (!hk1Semester && !hk2Semester) {
          throw new Error("Không tìm thấy kỳ học nào cho năm học này.");
        }
        const newSemesterIds = {
          hk1: hk1Semester?._id || "",
          hk2: hk2Semester?._id || "",
        };
        setSemesterIds(newSemesterIds);

        // Fetch student details
        const usersRes = await axios.post<{ data: Student[] }>(
          "http://localhost:4003/api/users/batch",
          { ids: students },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const studentDetails = usersRes.data.data;

        // Fetch scores for each student using getStatusAndBehavior API
        const enrichedStudents = await Promise.all(
          studentDetails.map(async (student: Student) => {
            try {
              if (!newSemesterIds.hk1 && !newSemesterIds.hk2) {
                return {
                  ...student,
                  hk1_gpa: "N/A",
                  hk1_behavior: "N/A",
                  hk2_gpa: "N/A",
                  hk2_behavior: "N/A",
                  avg_gpa: "N/A",
                };
              }

              const semesterIdsParam = [newSemesterIds.hk1, newSemesterIds.hk2]
                .filter((id) => id)
                .join(",");
              if (!semesterIdsParam) {
                return {
                  ...student,
                  hk1_gpa: "N/A",
                  hk1_behavior: "N/A",
                  hk2_gpa: "N/A",
                  hk2_behavior: "N/A",
                  avg_gpa: "N/A",
                };
              }

              const scoresRes = await axios.get<{ data: Score[] }>(
                `http://localhost:4002/api/students/status-behavior?user_id=${student._id}&semester_ids=${semesterIdsParam}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const scores = scoresRes.data.data;

              const hk1Score = scores.find(
                (s: Score) => s.semester_id === newSemesterIds.hk1
              ) || {
                gpa: "N/A",
                behavior: "N/A",
              };
              const hk2Score = scores.find(
                (s: Score) => s.semester_id === newSemesterIds.hk2
              ) || {
                gpa: "N/A",
                behavior: "N/A",
              };

              const hk1Gpa =
                hk1Score.gpa !== "N/A" ? parseFloat(hk1Score.gpa) : null;
              const hk2Gpa =
                hk2Score.gpa !== "N/A" ? parseFloat(hk2Score.gpa) : null;
              const avgGpa =
                hk1Gpa !== null && hk2Gpa !== null
                  ? ((hk1Gpa + hk2Gpa) / 2).toFixed(2)
                  : hk1Gpa !== null
                  ? hk1Gpa.toFixed(2)
                  : hk2Gpa !== null
                  ? hk2Gpa.toFixed(2)
                  : "N/A";

              return {
                ...student,
                hk1_gpa: hk1Score.gpa,
                hk1_behavior: hk1Score.behavior,
                hk2_gpa: hk2Score.gpa,
                hk2_behavior: hk2Score.behavior,
                avg_gpa: avgGpa,
              };
            } catch (err) {
              console.error(
                `Lỗi khi lấy điểm cho học sinh ${student._id}:`,
                (err as Error).message
              );
              return {
                ...student,
                hk1_gpa: "N/A",
                hk1_behavior: "N/A",
                hk2_gpa: "N/A",
                hk2_behavior: "N/A",
                avg_gpa: "N/A",
              };
            }
          })
        );

        setOriginalStudents(enrichedStudents);
        setFilteredStudents(enrichedStudents);
      } catch (err) {
        const errorMessage =
          (err as Error)?.message || "Lỗi khi lấy dữ liệu. Vui lòng thử lại.";
        setError(errorMessage);
        console.error("Lỗi khi tải dữ liệu:", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user._id, selectedSchoolYear]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const result = originalStudents.filter(
      (s: Student) =>
        s.name.toLowerCase().includes(term) ||
        s.tdt_id.toLowerCase().includes(term)
    );
    setFilteredStudents(result);
  };

  const handleSendForApproval = async () => {
    setLoading(true);
    setError("");
    try {
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }
      if (!classData.students.length) {
        throw new Error("Không có học sinh để gửi duyệt.");
      }
      if (!selectedSchoolYear) {
        throw new Error("Vui lòng chọn năm học trước khi gửi duyệt.");
      }

      const submission = {
        class_id: classData.class_id,
        class_name: classData.class_name,
        school_year: selectedSchoolYear,
        students: filteredStudents
          .map((s: Student) => ({
            student_id: s._id,
            name: s.name,
            hk1: {
              gpa:
                typeof s.hk1_gpa === "string" && s.hk1_gpa === "N/A"
                  ? null
                  : parseFloat(s.hk1_gpa as string) || null,
              behavior: s.hk1_behavior,
            },
            hk2: {
              gpa:
                typeof s.hk2_gpa === "string" && s.hk2_gpa === "N/A"
                  ? null
                  : parseFloat(s.hk2_gpa as string) || null,
              behavior: s.hk2_behavior,
            },
          }))
          .filter((s) => s.hk1.gpa !== null || s.hk2.gpa !== null), // Remove students with no scores
      };

      if (submission.students.length === 0) {
        throw new Error("Không có học sinh nào có dữ liệu điểm để gửi duyệt.");
      }

      const response = await axios.post<{ approvalId: string }>(
        "http://localhost:4000/api/approvals/submit",
        submission,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbar({
        open: true,
        message: `Đã gửi danh sách để duyệt. ID: ${response.data.approvalId}`,
      });
    } catch (err) {
      const errorMessage =
        (err as Error)?.message || "Lỗi khi gửi duyệt. Vui lòng thử lại.";
      setError(errorMessage);
      console.error("Lỗi khi gửi duyệt:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Đang tải danh sách học sinh...</div>;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Bảng điểm học sinh</h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <select
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedSchoolYear}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedSchoolYear(e.target.value)
          }
        >
          <option value="">Chọn năm học</option>
          {schoolYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
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
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
          onClick={handleSendForApproval}
          disabled={loading || !selectedSchoolYear}
        >
          {loading ? "Đang gửi..." : "Gửi duyệt"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-3 px-4 text-left">Họ và tên</th>
              <th className="py-3 px-4 text-left">Lớp</th>
              <th className="py-3 px-4 text-left">Mã định danh</th>
              <th className="py-3 px-4 text-left">Điểm HK1</th>
              <th className="py-3 px-4 text-left">Hạnh kiểm HK1</th>
              <th className="py-3 px-4 text-left">Điểm HK2</th>
              <th className="py-3 px-4 text-left">Hạnh kiểm HK2</th>
              <th className="py-3 px-4 text-center">Điểm trung bình</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-3 px-4 text-center text-gray-500">
                  Không có học sinh nào để hiển thị.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student: Student) => (
                <tr key={student._id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{student.name}</td>
                  <td className="py-3 px-4">{classData.class_id}</td>
                  <td className="py-3 px-4">{student.tdt_id}</td>
                  <td className="py-3 px-4">{student.hk1_gpa}</td>
                  <td className="py-3 px-4">{student.hk1_behavior}</td>
                  <td className="py-3 px-4">{student.hk2_gpa}</td>
                  <td className="py-3 px-4">{student.hk2_behavior}</td>
                  <td className="py-3 px-4 text-center">{student.avg_gpa}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {snackbar.open && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          {snackbar.message}
          <button
            className="ml-4 text-white"
            onClick={() => setSnackbar({ open: false, message: "" })}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
