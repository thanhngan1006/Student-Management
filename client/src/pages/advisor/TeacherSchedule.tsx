import axios from "axios";
import { useEffect, useState } from "react";

interface Period {
  period: number;
  subject: string;
  teacher_id: string;
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface Schedule {
  className: string;
  schoolYear: string;
  semester: number;
  schedule: DaySchedule[];
}

interface Semester {
  _id: string;
  semester_name: string;
}

const TeacherSchedule = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("Teacher ID:", user._id);

  const dayMapping: { [key: string]: string } = {
    "Day 1": "Thứ 2",
    "Day 2": "Thứ 3",
    "Day 3": "Thứ 4",
    "Day 4": "Thứ 5",
    "Day 5": "Thứ 6",
    "Day 6": "Thứ 7",
  };

  const parseSemesterName = (semesterName: string): { schoolYear: string; semester: number } => {
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
        const res = await axios.get("http://localhost:4001/api/semesters", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSemesters(res.data);
        if (res.data.length > 0) {
          setSelectedSemester(res.data[0]._id);
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

    const fetchTeacherSchedule = async () => {
      setLoading(true);
      setError(null);
      setSchedules([]);

      try {
        const semester = semesters.find((s) => s._id === selectedSemester);
        if (!semester) return;

        const { schoolYear, semester: semesterNumber } = parseSemesterName(semester.semester_name);

        const res = await axios.get("http://localhost:4001/api/schedule/teacher", {
          params: {
            teacherId: user._id,
            schoolYear,
            semester: semesterNumber,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedSchedules: Schedule[] = res.data.data;
        setSchedules(fetchedSchedules);
      } catch (err: any) {
        console.error("Lỗi khi lấy thời khóa biểu của giáo viên:", err);
        setError(err.response?.data?.message || "Đã có lỗi xảy ra khi lấy thời khóa biểu");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherSchedule();
  }, [selectedSemester, semesters, token]);

  const tableData: { [key: string]: { [key: number]: { className: string; subject: string }[] } } = {
    "Day 1": { 1: [], 2: [], 3: [], 4: [], 5: [] },
    "Day 2": { 1: [], 2: [], 3: [], 4: [], 5: [] },
    "Day 3": { 1: [], 2: [], 3: [], 4: [], 5: [] },
    "Day 4": { 1: [], 2: [], 3: [], 4: [], 5: [] },
    "Day 5": { 1: [], 2: [], 3: [], 4: [], 5: [] },
    "Day 6": { 1: [], 2: [], 3: [], 4: [], 5: [] },
  };

  schedules.forEach((schedule) => {
    schedule.schedule.forEach((daySchedule) => {
      const day = daySchedule.day;
      daySchedule.periods.forEach((period) => {
        const periodNumber = period.period;
        tableData[day][periodNumber].push({
          className: schedule.className,
          subject: period.subject,
        });
      });
    });
  });

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
        <div className="text-center text-gray-500">Đang tải thời khóa biểu...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
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
                  {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"].map((day, index) => {
                    const periodsForDayAndPeriod = tableData[day][period];
                    return (
                      <td key={index} className="border p-2">
                        {periodsForDayAndPeriod.length > 0 ? (
                          periodsForDayAndPeriod.map((item, idx) => (
                            <div key={idx} className="mb-1">
                              <div className="font-medium text-blue-600">
                                {item.className} - {item.subject}
                              </div>
                            </div>
                          ))
                        ) : (
                          "---"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;