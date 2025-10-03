import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const StudentScoreDetail = () => {
  const { studentId } = useParams();
  const token = localStorage.getItem("token");
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState("all");
  const [grades, setGrades] = useState<any[]>([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [classId, setClassId] = useState<string>("");

  useEffect(() => {
    const fetchStudent = async () => {
      console.log(classId);

      try {
        const userRes = await axios.get(
          `http://localhost:4003/api/users/tdt/${studentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const stid = userRes.data._id;

        const classRes = await axios.get(
          `http://localhost:4000/api/students/${stid}/class`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const classId = classRes.data.class.class_id;
        setStudentInfo(userRes.data);
        setClassId(classId);

        // const scoreGroupedRes = await axios.get(
        //   `http://localhost:4002/api/students/${userRes.data._id}/scores-by-semester`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //   }
        // );

        const semesterRes = await axios.get(
          `http://localhost:4000/api/${classId}/available-semesters`,
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

        if (formattedSemesters.length > 0) {
          setSelectedSemesterId(formattedSemesters[0].id);
        }
        // const grouped = scoreGroupedRes.data as Record<
        //   string,
        //   { name: string }
        // >;
        // const formatted = Object.entries(grouped).map(([id, { name }]) => ({
        //   id,
        //   name,
        // }));
        // setSemesters(formatted);
        // if (formatted.length > 0) {
        //   setSelectedSemesterId(formatted[0].id);
        // }
      } catch (err) {
        console.error("Lỗi khi tải thông tin học sinh hoặc học kỳ:", err);
      }
    };

    fetchStudent();
  }, [studentId, token]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!studentInfo || !selectedSemesterId) return;
      setLoading(true);
      setGrades([]);
      setGpa(0);
      setStatus("");
      try {
        const res = await axios.get(
          `http://localhost:4002/api/students/${studentInfo._id}/scores?semester_id=${selectedSemesterId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setGrades(res.data.scores);
        setStatus(res.data.status || "");
        setGpa(parseFloat(res.data.semesterGpa));
      } catch (err) {
        console.error("Lỗi khi tải điểm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [studentInfo, selectedSemesterId]);

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

    if (!editingSubject.subject_id) {
      alert("Mã môn học không hợp lệ!");
      return;
    }
    try {
      await axios.put(
        `http://localhost:4002/api/students/scores/update`,
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
        `http://localhost:4002/api/students/${studentInfo._id}/scores?semester_id=${selectedSemesterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Updated grades:", res.data.scores);
      setGrades(res.data.scores);
      setStatus(res.data.status || "");
      setGpa(parseFloat(res.data.semesterGpa));

      alert("Cập nhật điểm thành công!");
    } catch (error: any) {
      console.error("Lỗi khi lưu điểm:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  if (loading) return <div className="p-6">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md w-full md:w-1/3">
          <h2 className="text-xl font-semibold mb-4">{studentInfo.name}</h2>
          <p className="text-sm mb-1">
            <strong>Mã định danh:</strong> {studentInfo.tdt_id}
          </p>
          <p className="text-sm mb-1">
            <strong>DTB:</strong> {gpa.toFixed(2)}
          </p>
          <p className="text-sm mb-4">
            <strong>Trạng thái:</strong> {status}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Nhấn nút lọc ở cột <strong>Kì học</strong> để xem chi tiết từng kì
          </p>
        </div>

        <div className="w-full md:w-2/3">
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
                <th className="p-3 text-left">
                  <div className="flex flex-col">
                    <span>Kì học</span>
                    <select
                      className="text-sm mt-1 px-2 py-1 border rounded bg-white"
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
                </th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index} className="border-t text-sm">
                  <td className="p-3">{grade.subject_name}</td>
                  <td className="p-3">{grade.subject_code}</td>
                  <td className="p-3 text-center">{grade.score_15p ?? "-"}</td>
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
                  <td className="p-3">
                    {selectedSemesterId === "all" ? grade.semester_name : ""}
                    {selectedSemesterId !== "all" && (
                      <button
                        onClick={() => {
                          setEditingSubject(grade);
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-blue-400 hover:bg-blue-500 rounded text-amber-50"
                      >
                        Sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold border-t">
                <td className="p-3" colSpan={2}>
                  Tổng kết
                </td>
                <td className="p-3 text-center">{gpa.toFixed(2)}</td>
                <td className="p-3"></td>
              </tr>
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

export default StudentScoreDetail;
