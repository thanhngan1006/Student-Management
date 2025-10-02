import axios from "axios";
import { useEffect, useState, version } from "react";

type Props = {};

const Schedule = (props: Props) => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [versions, setVersions] = useState<{ version: number, isApproved: boolean }[]>([]);  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<{ [key: string]: string }>({});
  const [showModal, setShowModal] = useState<boolean>(false);
  const token = localStorage.getItem("token");

  const dayMapping: { [key: string]: string } = {
    "Day 1": "Thứ 2",
    "Day 2": "Thứ 3",
    "Day 3": "Thứ 4",
    "Day 4": "Thứ 5",
    "Day 5": "Thứ 6",
    "Day 6": "Thứ 7",
  };

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axios.get("http://localhost:4001/api/semesters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSemesters(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách kỳ học:", err);
      }
    };

    fetchSemesters();
  }, [token]);

  const parseSemesterName = (semesterName: string) => {
    const parts = semesterName.split(" "); 
    if (parts.length !== 2) {
      throw new Error(`Invalid semester_name format: ${semesterName}`);
    }

    const semesterPart = parts[0]; 
    const schoolYear = parts[1];
    const semester = semesterPart === "HK1" ? 1 : 2;

    return { schoolYear, semester };
  };

  const fetchVersions = async () => {
    if (!selectedSemester) {
      setVersions([]);
      setSelectedVersion(null);
      return;
    }

    try {
      const semester = semesters.find((s) => s._id === selectedSemester);
      if (!semester) return;

      const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

      const res = await axios.get("http://localhost:4001/api/schedule/version", {
        params: {
          schoolYear: schoolYear,
          semester: semesterNumber,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedVersions = res.data.data || [];
      setVersions(fetchedVersions);
      setSelectedVersion(fetchedVersions.length > 0 ? fetchedVersions[0] : null); // Chọn version cao nhất mặc định
    } catch (err) {
      console.error("Lỗi khi lấy version:", err);
      setVersions([]);
      setSelectedVersion(null);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedSemester || !selectedVersion) return;

    try {
      const semester = semesters.find((s) => s._id === selectedSemester);
      if (!semester) return;

      const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

      const res = await axios.get("http://localhost:4001/api/schedule/schedules", {
        params: {
          schoolYear: schoolYear,
          semester: semesterNumber,
          version: selectedVersion,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedSchedules = res.data.data || [];
      setSchedules(fetchedSchedules);

      const teacherIds = [...new Set(
        fetchedSchedules.flatMap((s: any) =>
          s.schedule.flatMap((d: any) =>
            d.periods.map((p: any) => p.teacher_id)
          )
        )
      )];

      if (teacherIds.length > 0) {
        const teacherRes = await axios.post(
          "http://localhost:4003/api/users/teachers",
          { ids: teacherIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const teacherData = teacherRes.data.reduce((acc: any, teacher: any) => {
          acc[teacher._id] = teacher.name || "Unknown Teacher";
          return acc;
        }, {});
        setTeachers(teacherData);
      }
    } catch (err) {
      console.error("Lỗi khi lấy thời khóa biểu:", err);
    }
  };
  
  useEffect(() => {
    fetchVersions();
  }, [selectedSemester, semesters, token]);

  useEffect(() => {
    fetchSchedules();
  }, [selectedVersion, selectedSemester, semesters, token]);

  const handleCreateSchedule = () => {
    setShowModal(true); // Hiển thị modal khi nhấn nút
  };

  const handleCloseModal = () => {
    setShowModal(false); // Đóng modal
  };

  const handleSubmit = async () => {
    if (!selectedSemester) {
      alert("Vui lòng chọn kỳ học trước khi tạo thời khóa biểu!");
      return;
    }

    try {
      const semester = semesters.find((s) => s._id === selectedSemester);
      if (!semester) {
        alert("Kỳ học không hợp lệ!");
        return;
      }

      const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

      const response = await axios.post(
        "http://localhost:4001/api/schedule/generate-schedule",
        {
          schoolYear: schoolYear,
          semester: semesterNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message); 
      handleCloseModal(); 

      await fetchVersions();
      await fetchSchedules();
    } catch (err: any) {
      console.error("Lỗi khi tạo thời khóa biểu:", err);
      alert("Lỗi khi tạo thời khóa biểu: " + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveVersion = async (version: number) => {
    if (!selectedSemester) return;

    try {
      const semester = semesters.find((s) => s._id === selectedSemester);
      if (!semester) return;

      const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

      const response = await axios.post(
        "http://localhost:4001/api/schedule/approve",
        {
          schoolYear: schoolYear,
          semester: semesterNumber,
          version: version,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message);
      await fetchVersions(); 
      await fetchSchedules(); 
    } catch (err: any) {
      console.error("Lỗi khi duyệt version:", err);
      alert("Lỗi khi duyệt version: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUnapproveVersion = async (version: number) => {
    if (!selectedSemester) return;

    try {
      const semester = semesters.find((s) => s._id === selectedSemester);
      if (!semester) return;

      const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

      const response = await axios.post(
        "http://localhost:4001/api/schedule/unapprove",
        {
          schoolYear: schoolYear,
          semester: semesterNumber,
          version: version,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message);
      await fetchVersions(); 
      await fetchSchedules();
    } catch (err: any) {
      console.error("Lỗi khi hủy duyệt version:", err);
      alert("Lỗi khi hủy duyệt version: " + (err.response?.data?.message || err.message));
    }
  };

  const scheduleDataByClass = schedules.map((currentSchedule: any) => {
    const scheduleData: any[] = [];
    ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"].forEach(day => {
      const daySchedule = currentSchedule.schedule.find((d: any) => d.day === day);
      scheduleData.push({
        day: dayMapping[day],
        periods: daySchedule ? daySchedule.periods : Array(5).fill(null)
      });
    });
    return {
      className: currentSchedule.className,
      scheduleData
    };
  });

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thời khóa biểu</h1>
        <button
          onClick={handleCreateSchedule}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Tạo thời khóa biểu
        </button>
      </div>

      <div className="mb-4 flex items-center space-x-4">
      <div className="mb-4 flex items-center">
        <label htmlFor="semester-select" className="mr-2 text-gray-700">
          Chọn kỳ học:
        </label>
        <select
          id="semester-select"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">Tất cả kỳ học</option>
          {semesters.map((semester) => (
            <option key={semester._id} value={semester._id}>
              {semester.semester_name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center">
          <label htmlFor="version-select" className="mr-2 text-gray-700">
            Chọn version:
          </label>
          <select
            id="version-select"
            value={selectedVersion || ""}
            onChange={(e) => setSelectedVersion(e.target.value ? Number(e.target.value) : null)}
            className="border rounded p-2"
            disabled={!selectedSemester}
          >
            <option value="">Tất cả version</option>
            {versions.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version}
              </option>
            ))}
          </select>
        </div>
      </div>
      {versions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Danh sách version</h3>
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Version</th>
                <th className="border p-2">Trạng thái</th>
                <th className="border p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.version}>
                  <td className="border p-2">Version {v.version}</td>
                  <td className="border p-2">
                    {v.isApproved ? "Đã duyệt" : "Chưa duyệt"}
                  </td>
                  <td className="border p-2 flex space-x-2">
                    {!v.isApproved ? (
                      <button
                        onClick={() => handleApproveVersion(v.version)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg"
                      >
                        Duyệt
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnapproveVersion(v.version)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg"
                      >
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    {scheduleDataByClass.length > 0 ? (
      scheduleDataByClass.map((classSchedule: any) => (
        <div key={classSchedule.className} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Lớp: {classSchedule.className}</h2>
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Tiết/Thứ</th>
              <th className="border p-2">Thứ 2</th>
              <th className="border p-2">Thứ 3</th>
              <th className="border p-2">Thứ 4</th>
              <th className="border p-2">Thứ 5</th>
              <th className="border p-2">Thứ 6</th>
              <th className="border p-2">Thứ 7</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((period) => (
              <tr key={period}>
                <td className="border p-2 font-semibold">Tiết {period}</td>
                {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"].map(
                  (day, index) => {
                    const daySchedule = classSchedule.scheduleData.find((s: any) => s.day === day);
                    const periodData = daySchedule?.periods[period - 1];
                    return (
                      <td key={index} className="border p-2">
                        {periodData ? (
                          <div>
                            <div className="font-medium text-blue-600">
                              {periodData.subject}
                            </div>
                            <div className="text-sm text-gray-600">
                              GV: {teachers[periodData.teacher_id] || "Unknown"}
                            </div>
                            
                          </div>
                        ) : (
                          "---"
                        )}
                      </td>
                    );
                  }
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
      ))
    ): (
      <div className="text-center text-gray-500">
          Không có thời khóa biểu cho kỳ học đã chọn
        </div>
    )}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Chọn kỳ học</h2>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border rounded p-2 mb-4 w-full"
            >
              <option value="">Chọn kỳ học</option>
              {semesters.map((semester) => (
                <option key={semester._id} value={semester._id}>
                  {semester.semester_name}
                </option>
              ))}
            </select>
            <div className="flex justify-end">
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg mr-2"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Schedule;
