import axios from "axios";
import { useEffect, useState } from "react";

interface Schedule {
  className: string;
  schoolYear: string;
  semester: number;
  version: number;
  schedule: {
    day: string;
    periods: { subject: string; teacher_id: string }[];
  }[];
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Semester {
  _id: string;
  semester_name: string;
}

const CLASS_SERVICE_URL = import.meta.env.VITE_CLASS_SERVICE_URL;
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL;
const EDUCATION_SERVICE_URL = import.meta.env.VITE_EDUCATION_SERVICE_URL;

const StudentSchedule = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [teachers, setTeachers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const dayMapping: { [key: string]: string } = {
    "Day 1": "Thứ 2",
    "Day 2": "Thứ 3",
    "Day 3": "Thứ 4",
    "Day 4": "Thứ 5",
    "Day 5": "Thứ 6",
    "Day 6": "Thứ 7",
  };

  const parseSemesterName = (
    semesterName: string
  ): { schoolYear: string; semester: number } => {
    const parts = semesterName.split(" ");
    if (parts.length !== 2) {
      throw new Error(`Invalid semester_name format: ${semesterName}`);
    }

    const semesterPart = parts[0];
    const schoolYear = parts[1];
    const semester = semesterPart === "HK1" ? 1 : 2;

    return { schoolYear, semester };
  };

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const classRes = await axios.get(
          `${CLASS_SERVICE_URL}/api/students/${user._id}/class`,
          {
            // Thay thế
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const className = classRes.data.class.class_id;

        const res = await axios.get(
          `${CLASS_SERVICE_URL}/${className}/available-semesters`,
          {
            // Thay thế
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSemesters(res.data.semesters);

        if (res.data.semesters.length > 0) {
          setSelectedSemester(res.data.semesters[0]._id);
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách kỳ học:", err);
        setError("Không thể lấy danh sách kỳ học");
      }
    };

    fetchSemesters();
  }, [token]);

  useEffect(() => {
    if (!selectedSemester) return;

    const fetchApprovedSchedule = async () => {
      setLoading(true);
      setError(null);
      setSchedule(null);
      setTeachers({});

      try {
        const classRes = await axios.get(
          `${CLASS_SERVICE_URL}/api/students/${user._id}/class`,
          {
            // Thay thế
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const className = classRes.data.class.class_id;
        const semester = semesters.find((s) => s._id === selectedSemester);
        if (!semester) return;

        const { schoolYear, semester: semesterNumber } = parseSemesterName(
          semester.semester_name
        );

        const res = await axios.get(
          `${EDUCATION_SERVICE_URL}/api/schedule/approved`,
          {
            // Thay thế
            params: {
              className,
              schoolYear,
              semester: semesterNumber,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fetchedSchedule: Schedule = res.data.data;
        setSchedule(fetchedSchedule);

        const teacherIds = fetchedSchedule.schedule.flatMap((d) =>
          d.periods.map((p) => p.teacher_id)
        );

        if (teacherIds.length > 0) {
          const teacherRes = await axios.post(
            `${USER_SERVICE_URL}/api/users/teachers`, // Thay thế
            { ids: teacherIds },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const teacherData = teacherRes.data.reduce(
            (acc: any, teacher: any) => {
              acc[teacher._id] = teacher.name || "Unknown Teacher";
              return acc;
            },
            {}
          );
          setTeachers(teacherData);
        }
      } catch (err: any) {
        console.error("Lỗi khi lấy thời khóa biểu:", err);
        setError(
          err.response?.data?.message ||
            "Đã có lỗi xảy ra khi lấy thời khóa biểu"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedSchedule();
  }, [selectedSemester, semesters, token]);

  const scheduleData = schedule
    ? ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"].map((day) => {
        const daySchedule = schedule.schedule.find((d) => d.day === day);
        return {
          day: dayMapping[day],
          periods: daySchedule ? daySchedule.periods : Array(5).fill(null),
        };
      })
    : [];

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Thời khóa biểu của bạn</h1>

      <div className="mb-4 flex items-center space-x-4">
        <div className="flex items-center">
          <label htmlFor="semester-select" className="mr-2 text-gray-700">
            Chọn kỳ học:
          </label>
          <select
            id="semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="border rounded p-2"
            disabled={semesters.length === 0}
          >
            <option value="">Chọn kỳ học</option>
            {semesters.map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semester.semester_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">
          Đang tải thời khóa biểu...
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : schedule ? (
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
                      const daySchedule = scheduleData.find(
                        (s) => s.day === day
                      );
                      const periodData = daySchedule?.periods[period - 1];
                      return (
                        <td key={index} className="border p-2">
                          {periodData ? (
                            <div>
                              <div className="font-medium text-blue-600">
                                {periodData.subject}
                              </div>
                              <div className="text-sm text-gray-600">
                                GV:{" "}
                                {teachers[periodData.teacher_id] || "Unknown"}
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
      ) : (
        <div className="text-center text-gray-500">
          Hiện tại chưa có thời khóa biểu được duyệt cho kỳ học này.
        </div>
      )}
    </div>
  );
};

export default StudentSchedule;
