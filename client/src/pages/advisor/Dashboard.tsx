import axios from "axios";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement
);

interface Score {
  subject_name: string;
  score: number;
}

interface StudentScoreResponse {
  scores: Score[];
}

interface AcademicPerformance {
  excellent: number; // Giỏi: >= 8.0
  good: number; // Khá: >= 6.5 và < 8.0
  average: number; // Trung bình: >= 5.0 và < 6.5
  poor: number; // Yếu: < 5.0
}

const Dashboard: React.FC = () => {
  const teacherId = localStorage.getItem("tdt_id");
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [averageScores, setAverageScores] = useState<{ [key: string]: number }>(
    {}
  );
  const [academicPerformance, setAcademicPerformance] =
    useState<AcademicPerformance>({
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0,
    });
  const [subjectPerformance, setSubjectPerformance] = useState<{
    strongestSubject: string;
    weakestSubject: string;
    passRates: { [key: string]: number };
  }>({
    strongestSubject: "",
    weakestSubject: "",
    passRates: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [classId, setClassId] = useState<string>("");
console.log('Class ID:', classId);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/${classId}/available-semesters`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSemesters(res.data.semesters);

        if (res.data.semesters.length > 0) {
          setSelectedSemester(res.data.semesters[0]._id);
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách kỳ học:", err);
      }
    };

    fetchSemesters();
  }, [token, classId]);

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSemester(e.target.value);
    setError(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const teacheRes = await axios.get(
          `http://localhost:4003/api/users/tdt/${teacherId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const mongoTeacherId = teacheRes.data._id;
        const classRes = await axios.get(
          `http://localhost:4000/api/classes/by-teacher/${mongoTeacherId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fetchedClassId = classRes.data.class_id;
        setClassId(fetchedClassId);

        if (!fetchedClassId || !token) {
          setLoading(false);
          setError("Không tìm thấy thông tin lớp học hoặc token");
          return;
        }

        // 1. Lấy danh sách học sinh trong lớp
        const studentsRes = await axios.get(
          `http://localhost:4000/api/classes/${fetchedClassId}/students`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (
          !studentsRes.data?.students ||
          !Array.isArray(studentsRes.data.students)
        ) {
          setLoading(false);
          setError("Không tìm thấy học sinh trong lớp");
          return;
        }

        const totalStudents = studentsRes.data.students.length;

        // 2. Lấy điểm số của từng học sinh
        const studentScores = await Promise.all(
          studentsRes.data.students.map(async (student: any) => {
            try {
              const scoreRes = await axios.get<StudentScoreResponse>(
                `http://localhost:4002/api/students/${student._id}/scores?semester_id=${selectedSemester}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return scoreRes.data;
            } catch (err) {
              console.error(
                `Error fetching scores for student ${student._id}:`,
                err
              );
              return null;
            }
          })
        );

        // 3. Xử lý dữ liệu điểm số
        const subjects: { [key: string]: number[] } = {};
        const performance = { excellent: 0, good: 0, average: 0, poor: 0 };
        const passRates: { [key: string]: { pass: number; total: number } } =
          {};

        studentScores.forEach((response) => {
          if (!response || !response.scores) return;

          let studentAverage = 0;
          let validScores = 0;

          response.scores.forEach((score: any) => {
            if (!subjects[score.subject_name]) {
              subjects[score.subject_name] = [];
              passRates[score.subject_name] = { pass: 0, total: 0 };
            }

            if (typeof score.score === "number" && score.score > 0) {
              subjects[score.subject_name].push(score.score);
              studentAverage += score.score;
              validScores++;

              // Tính tỷ lệ đạt môn
              passRates[score.subject_name].total++;
              if (score.score >= 5) {
                passRates[score.subject_name].pass++;
              }
            }
          });

          // Phân loại học lực
          if (validScores > 0) {
            studentAverage = studentAverage / validScores;
            if (studentAverage >= 8.0) performance.excellent++;
            else if (studentAverage >= 6.5) performance.good++;
            else if (studentAverage >= 5.0) performance.average++;
            else performance.poor++;
          }
        });

        // 4. Tính điểm trung bình cho từng môn
        const averages: { [key: string]: number } = {};
        const finalPassRates: { [key: string]: number } = {};

        Object.entries(subjects).forEach(([subject, scores]) => {
          if (scores.length > 0) {
            averages[subject] = Number(
              (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
            );
          }
        });

        Object.entries(passRates).forEach(([subject, data]) => {
          if (data.total > 0) {
            finalPassRates[subject] = Number(
              ((data.pass / data.total) * 100).toFixed(2)
            );
          }
        });

        // 5. Xác định môn mạnh/yếu
        const subjectEntries = Object.entries(averages);
        const strongestSubject = subjectEntries.reduce((a, b) =>
          a[1] > b[1] ? a : b
        )[0];
        const weakestSubject = subjectEntries.reduce((a, b) =>
          a[1] < b[1] ? a : b
        )[0];

        // 6. Cập nhật state
        setAverageScores(averages);
        setAcademicPerformance(performance);
        setSubjectPerformance({
          strongestSubject,
          weakestSubject,
          passRates: finalPassRates,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Dữ liệu chưa được import đầy đủ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedSemester]);

  if (loading) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  // if (error) {
  //   return <div className="p-6 text-red-500">{error}</div>;
  // }

  if (error) {
    return (
      <div className="h-screen w-full">
        <div className="p-6 h-screen overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Tổng quan lớp {classId}
          </h1>
          <div className="mb-4">
            <label htmlFor="semester-select" className="mr-2 text-gray-700">
              Chọn kỳ học:
            </label>
            <select
              id="semester-select"
              value={selectedSemester}
              onChange={handleSemesterChange}
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
          <div className="bg-white p-6 rounded-lg shadow text-center text-red-500">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!classId) {
    return <div className="p-6">Không tìm thấy thông tin lớp học</div>;
  }

  const averageScoresChartData = {
    labels: Object.keys(averageScores),
    datasets: [
      {
        label: "Điểm trung bình theo môn học",
        data: Object.values(averageScores),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const performanceChartData = {
    labels: ["Giỏi", "Khá", "Trung bình", "Yếu"],
    datasets: [
      {
        data: [
          academicPerformance.excellent,
          academicPerformance.good,
          academicPerformance.average,
          academicPerformance.poor,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const passRatesChartData = {
    labels: Object.keys(subjectPerformance.passRates),
    datasets: [
      {
        label: "Tỷ lệ đạt môn (%)",
        data: Object.values(subjectPerformance.passRates),
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
      },
    },
  };

  const passrateOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6 h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Tổng quan lớp {classId}
        </h1>
        <div className="mb-4">
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

        {error ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-red-500">
            {error}
          </div>
        ) : !selectedSemester ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            Vui lòng chọn kỳ học để xem thống kê
          </div>
        ) : Object.keys(averageScores).length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
            Chưa có dữ liệu điểm số cho kỳ học này
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Điểm trung bình theo môn học */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Điểm trung bình theo môn học
              </h2>
              <Bar data={averageScoresChartData} options={options} />
            </div>

            {/* Phân loại học lực */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Phân loại học lực
              </h2>
              <Pie data={performanceChartData} options={pieOptions} />
            </div>

            {/* Tỷ lệ đạt môn */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Tỷ lệ đạt môn
              </h2>
              <Bar data={passRatesChartData} options={passrateOptions} />
            </div>

            {/* Thông tin tổng quan */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Thông tin tổng quan
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded">
                  <h3 className="font-semibold text-blue-800">
                    Môn học mạnh nhất
                  </h3>
                  <p className="text-blue-600">
                    {subjectPerformance.strongestSubject} (
                    {averageScores[subjectPerformance.strongestSubject]})
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded">
                  <h3 className="font-semibold text-red-800">
                    Môn học cần cải thiện
                  </h3>
                  <p className="text-red-600">
                    {subjectPerformance.weakestSubject} (
                    {averageScores[subjectPerformance.weakestSubject]})
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <h3 className="font-semibold text-green-800">
                    Tổng số học sinh theo học lực
                  </h3>
                  <ul className="list-disc list-inside text-green-600">
                    <li>Giỏi: {academicPerformance.excellent}</li>
                    <li>Khá: {academicPerformance.good}</li>
                    <li>Trung bình: {academicPerformance.average}</li>
                    <li>Yếu: {academicPerformance.poor}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
