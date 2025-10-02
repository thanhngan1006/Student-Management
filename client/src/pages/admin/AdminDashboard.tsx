import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaInfoCircle } from "react-icons/fa";

const AdminDashboard = () => {
  const token = localStorage.getItem("token");
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [promotionResults, setPromotionResults] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch pending approvals on mount
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      setLoading(true);
      setError("");
      try {
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }

        const response = await axios.get("http://localhost:4000/api/approvals/pending", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setPendingApprovals(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi lấy danh sách chờ duyệt.");
        console.error("Lỗi khi lấy danh sách chờ duyệt:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, [token]);

  const handleApproveSubmission = async (approvalId) => {
    setLoading(true);
    setError("");
    try {
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.patch(
        `http://localhost:4000/api/approvals/${approvalId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove the approved submission from pending list
      setPendingApprovals(pendingApprovals.filter((approval) => approval._id !== approvalId));
      setPromotionResults(response.data.promotionResults);
      setSnackbar({
        open: true,
        message: `Đã duyệt và chuyển lớp thành công: ${response.data.promotionDetails[0].status === "success" ? "Thành công" : "Thất bại"}`
      });
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi duyệt và chuyển lớp. Vui lòng thử lại.");
      console.error("Lỗi khi duyệt yêu cầu:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportToCSV = () => {
    if (!promotionResults || !Array.isArray(promotionResults)) return;

    const csv = [
      'Class,Status,Promoted,Repeated,StudentID,Reason',
      ...promotionResults.flatMap((r) =>
        [
          ...(r.promoted || []).map(p => `${r.class_id},${r.status},${r.promoted.length},${r.repeated.length},${p.student_id},Promoted`),
          ...(r.repeated || []).map(rp => `${r.class_id},${r.status},${r.promoted.length},${r.repeated.length},${rp.student_id},${rp.reason || 'N/A'}`)
        ]
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promotion_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Đang tải danh sách chờ duyệt...</div>;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Bảng Điều Khiển Quản Trị</h1>

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Yêu Cầu Duyệt Chờ Xử Lý</h2>
        {pendingApprovals.length === 0 ? (
          <div className="p-4 text-gray-500">Không có yêu cầu nào chờ duyệt.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-3 px-4 text-left">Lớp</th>
                  <th className="py-3 px-4 text-left">Năm học</th>
                  <th className="py-3 px-4 text-left">Chi tiết</th>
                  <th className="py-3 px-4 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((approval) => (
                  <React.Fragment key={approval._id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">{approval.class_name}</td>
                      <td className="py-3 px-4">{approval.school_year}</td>
                      <td className="py-3 px-4">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => toggleRow(approval._id)}
                        >
                          {expandedRows[approval._id] ? "Ẩn" : "Hiện"}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                          onClick={() => handleApproveSubmission(approval._id)}
                          disabled={loading}
                        >
                          {loading ? "Đang xử lý..." : "Duyệt"}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[approval._id] && (
                      <tr>
                        <td colSpan={4} className="p-4 bg-gray-50">
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                              <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                  <th className="py-2 px-4 text-left">Họ và tên</th>
                                  <th className="py-2 px-4 text-left">Mã định danh</th>
                                  <th className="py-2 px-4 text-left">Điểm HK1</th>
                                  <th className="py-2 px-4 text-left">Hạnh kiểm HK1</th>
                                  <th className="py-2 px-4 text-left">Điểm HK2</th>
                                  <th className="py-2 px-4 text-left">Hạnh kiểm HK2</th>
                                </tr>
                              </thead>
                              <tbody>
                                {approval.students.map((student) => (
                                  <tr key={student._id} className="border-t">
                                    <td className="py-2 px-4">{student.name}</td>
                                    <td className="py-2 px-4">{student.tdt_id}</td>
                                    <td className="py-2 px-4">{student.hk1_gpa}</td>
                                    <td className="py-2 px-4">{student.hk1_behavior}</td>
                                    <td className="py-2 px-4">{student.hk2_gpa}</td>
                                    <td className="py-2 px-4">{student.hk2_behavior}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {promotionResults && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Kết Quả Chuyển Lớp</h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            onClick={exportToCSV}
            disabled={loading}
          >
            Xuất CSV
          </button>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-3 px-4 text-left">Lớp</th>
                  <th className="py-3 px-4 text-left">Trạng thái</th>
                  <th className="py-3 px-4 text-left">Lên lớp</th>
                  <th className="py-3 px-4 text-left">Lưu ban</th>
                  <th className="py-3 px-4 text-left">Lỗi</th>
                  <th className="py-3 px-4 text-left">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {promotionResults.map((result) => (
                  <React.Fragment key={result.class_id}>
                    <tr className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">{result.class_id}</td>
                      <td className="py-3 px-4">{result.status}</td>
                      <td className="py-3 px-4">{result.promoted.length}</td>
                      <td className="py-3 px-4">{result.repeated.length}</td>
                      <td className="py-3 px-4">{result.error || "-"}</td>
                      <td className="py-3 px-4">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => toggleRow(result.class_id)}
                        >
                          {expandedRows[result.class_id] ? "Ẩn" : "Hiện"}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[result.class_id] && (
                      <tr>
                        <td colSpan={6} className="p-4 bg-gray-50">
                          <div>
                            <h3 className="font-semibold mb-2">Học Sinh Lên Lớp</h3>
                            <table className="min-w-full bg-white">
                              <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                  <th className="py-2 px-4 text-left">Mã HS</th>
                                  <th className="py-2 px-4 text-left">GPA</th>
                                  <th className="py-2 px-4 text-left">Hạnh kiểm</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.promoted.map((student) => (
                                  <tr key={student.student_id} className="border-t">
                                    <td className="py-2 px-4">{student.student_id}</td>
                                    <td className="py-2 px-4">{student.gpa}</td>
                                    <td className="py-2 px-4">{student.behavior}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <h3 className="font-semibold mt-4 mb-2">Học Sinh Lưu Ban</h3>
                            <table className="min-w-full bg-white">
                              <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                  <th className="py-2 px-4 text-left">Mã HS</th>
                                  <th className="py-2 px-4 text-left">GPA</th>
                                  <th className="py-2 px-4 text-left">Hạnh kiểm</th>
                                  <th className="py-2 px-4 text-left">Lý do</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.repeated.map((student) => (
                                  <tr key={student.student_id} className="border-t">
                                    <td className="py-2 px-4">{student.student_id}</td>
                                    <td className="py-2 px-4">{student.gpa}</td>
                                    <td className="py-2 px-4">{student.behavior}</td>
                                    <td className="py-2 px-4">{student.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

export default AdminDashboard;