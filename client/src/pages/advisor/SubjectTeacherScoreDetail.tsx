import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;
const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;
const SCORE_SERVICE_URL = import.meta.env.VITE_SCORE_SERVICE_URL;

const SubjectTeacherScoreDetail = () => {
  const { classId, studentId } = useParams();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const teacherId = user?.tdt_id;

  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log(loading);

      try {
        const userRes = await axios.get(
          `${USER_SERVICE_URL}/api/users/tdt/${studentId}`, // Thay thế
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStudentInfo(userRes.data);

        const semesterRes = await axios.get(
          `${CLASS_SERVICE_URL}/${classId}/available-semesters`, // Thay thế
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const formattedSemesters = semesterRes.data.semesters.map(
          (sem: any) => ({
            id: sem._id,
            name: sem.semester_name,
          })
        );
        setSemesters(formattedSemesters);
      } catch (err) {
        console.error("Lỗi khi tải thông tin:", err);
      }
    };

    fetchData();
  }, [classId, studentId, token]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!studentInfo || !selectedSemesterId) return;
      setLoading(true);
      setGrades([]);

      try {
        const res = await axios.get(
          `${SCORE_SERVICE_URL}/api/students/scores/${studentInfo._id}/by-teacher/${teacherId}?semester_id=${selectedSemesterId}`, // Thay thế
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const subject = res.data.subject || [res.data.subject];

        if (subject) {
          const formatted = {
            subject_id: subject.subject_id,
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            score_15p: subject.scores.find((s: any) => s.category === "15p")
              ?.score,
            score_1tiet: subject.scores.find((s: any) => s.category === "1tiet")
              ?.score,
            score_giuaky: subject.scores.find(
              (s: any) => s.category === "giuaky"
            )?.score,
            score_cuoiky: subject.scores.find(
              (s: any) => s.category === "cuoiky"
            )?.score,
            score: subject.subjectGPA,
          };

          setGrades([formatted]);
        } else {
          setGrades([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải điểm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [studentInfo, selectedSemesterId, teacherId, token]);

  const handleEditScore = async () => {
    const scores: Record<string, number> = {};
    if (editingSubject.score_15p !== undefined)
      scores["15p"] = editingSubject.score_15p;
    if (editingSubject.score_1tiet !== undefined)
      scores["1tiet"] = editingSubject.score_1tiet;
    if (editingSubject.score_giuaky !== undefined)
      scores["giuaky"] = editingSubject.score_giuaky;
    if (editingSubject.score_cuoiky !== undefined)
      scores["cuoiky"] = editingSubject.score_cuoiky;

    try {
      await axios.put(
        `${SCORE_SERVICE_URL}/api/students/scores/update`, // Thay thế
        {
          user_id: studentInfo._id,
          subject_id: editingSubject.subject_id,
          semester_id: selectedSemesterId,
          scores,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEditingSubject(null);

      const res = await axios.get(
        `${SCORE_SERVICE_URL}/api/students/scores/${studentInfo._id}/by-teacher/${teacherId}?semester_id=${selectedSemesterId}`, // Thay thế
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const subject = res.data.subject || [res.data.subject];

      if (subject) {
        const formatted = {
          subject_id: subject.subject_id,
          subject_code: subject.subject_code,
          subject_name: subject.subject_name,
          score_15p: subject.scores.find((s: any) => s.category === "15p")
            ?.score,
          score_1tiet: subject.scores.find((s: any) => s.category === "1tiet")
            ?.score,
          score_giuaky: subject.scores.find((s: any) => s.category === "giuaky")
            ?.score,
          score_cuoiky: subject.scores.find((s: any) => s.category === "cuoiky")
            ?.score,
          score: subject.subjectGPA,
        };

        setGrades([formatted]);
      } else {
        setGrades([]);
      }

      alert("Cập nhật điểm thành công!");
    } catch (error: any) {
      console.error("Lỗi khi lưu điểm:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  // if (loading) return <div className="p-6">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md w-full md:w-1/3">
          <h2 className="text-xl font-semibold mb-4">{studentInfo?.name}</h2>
          <p className="text-sm mb-1">
            <strong>Mã định danh:</strong> {studentInfo?.tdt_id}
          </p>
          <p className="text-sm mb-1">
            <strong>Lớp:</strong> {classId}
          </p>
        </div>

        <div className="w-full md:w-2/3">
          <div className="mb-4">
            <select
              className="px-4 py-2 border rounded-md"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
            >
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full bg-white rounded-lg shadow-md overflow-hidden">
            <thead className="bg-gray-200 text-gray-700 text-sm">
              <tr>
                <th className="p-3 text-left">Tên môn</th>
                <th className="p-3 text-left">Mã môn</th>
                <th className="p-3 text-center">Điểm 15p</th>
                <th className="p-3 text-center">Điểm 1 tiết</th>
                <th className="p-3 text-center">Điểm giữa kỳ</th>
                <th className="p-3 text-center">Điểm cuối kỳ</th>
                <th className="p-3 text-center">Điểm trung bình</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {grades.length > 0 ? (
                grades.map((grade, index) => (
                  <tr key={index} className="border-t text-sm">
                    <td className="p-3">{grade.subject_name}</td>
                    <td className="p-3">{grade.subject_code}</td>
                    <td className="p-3 text-center">
                      {grade.score_15p ?? "-"}
                    </td>
                    <td className="p-3 text-center">
                      {grade.score_1tiet ?? "-"}
                    </td>
                    <td className="p-3 text-center">
                      {grade.score_giuaky ?? "-"}
                    </td>
                    <td className="p-3 text-center">
                      {grade.score_cuoiky ?? "-"}
                    </td>
                    <td className="p-3 text-center">{grade.score ?? "-"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setEditingSubject(grade)}
                        className="px-2 py-1 text-xs bg-blue-400 hover:bg-blue-500 rounded text-white"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-gray-500">
                    Chưa có dữ liệu điểm cho học kỳ này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <h2 className="text-xl font-bold mb-4">
              Chỉnh sửa điểm: {editingSubject.subject_name}
            </h2>

            {["score_15p", "score_1tiet", "score_giuaky", "score_cuoiky"].map(
              (key) => (
                <div key={key} className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    {key.replace("score_", "").toUpperCase()}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border px-3 py-2 rounded"
                    value={editingSubject[key] ?? ""}
                    onChange={(e) =>
                      setEditingSubject({
                        ...editingSubject,
                        [key]: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              )
            )}

            <div className="flex justify-end mt-4 gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setEditingSubject(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded"
                onClick={handleEditScore}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTeacherScoreDetail;
