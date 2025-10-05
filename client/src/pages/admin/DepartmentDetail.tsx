import axios from "axios";
import { useEffect, useState } from "react";
import { IoInformationCircle } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { useParams, useNavigate } from "react-router-dom";

// Định nghĩa URL từ env vars
const DEPARTMENT_SERVICE_URL = import.meta.env.VITE_EDUCATION_SERVICE_URL;

const DepartmentDetail = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();

  const [departmentInfo, setDepartmentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newTeacherInfo, setNewTeacherInfo] = useState({
    email: "",
    subject: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!departmentId) return;
    setLoading(true);

    axios
      .get(`${DEPARTMENT_SERVICE_URL}/api/departments/${departmentId}`, {
        // Thay thế
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        setDepartmentInfo(res.data);
      })
      .catch((err) => {
        console.error("Lỗi khi lấy chi tiết tổ:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [departmentId]);

  const handleAddTeacher = async () => {
    if (!newTeacherInfo.email || !newTeacherInfo.subject) {
      alert("Vui lòng nhập email và chọn môn học.");
      return;
    }

    try {
      await axios.post(
        `${DEPARTMENT_SERVICE_URL}/api/departments/${departmentId}/add-teacher`, // Thay thế
        {
          email: newTeacherInfo.email.trim(),
          subject_id: newTeacherInfo.subject,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Thêm giáo viên thành công!");

      // Sau khi thêm xong, load lại dữ liệu tổ
      const res = await axios.get(
        `${DEPARTMENT_SERVICE_URL}/api/departments/${departmentId}`, // Thay thế
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setDepartmentInfo(res.data);

      // Reset form
      setNewTeacherInfo({ email: "", subject: "" });
    } catch (err: any) {
      console.error("Lỗi khi thêm giáo viên:", err);
      alert(err.response?.data?.message || "Thêm giáo viên thất bại.");
    }
  };

  const handleRemoveTeacher = async (teacherId: string, subjectId: string) => {
    try {
      await axios.delete(
        `${DEPARTMENT_SERVICE_URL}/api/departments/${departmentId}/subjects/${subjectId}/users/${teacherId}`, // Thay thế
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Xóa giáo viên thành công!");

      // Reload dữ liệu tổ
      const res = await axios.get(
        `${DEPARTMENT_SERVICE_URL}/api/departments/${departmentId}`, // Thay thế
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setDepartmentInfo(res.data);
    } catch (err: any) {
      console.error("Lỗi khi xóa giáo viên:", err);
      alert(err.response?.data?.message || "Xóa giáo viên thất bại.");
    }
  };

  const handleViewTeacherDetail = (teacherId: string) => {
    navigate(`/admin/department/${departmentId}/${teacherId}`);
  };

  if (loading)
    return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
  if (!departmentInfo)
    return <div className="p-4 text-center">Không tìm thấy tổ.</div>;

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="w-9/12 mx-auto relative">
        {departmentInfo && (
          <div className="mb-6 bg-blue-50 p-4 rounded shadow">
            <h2 className="text-xl font-bold">
              Thông tin tổ: {departmentInfo.name}
            </h2>
            <p className="mt-2">
              Các môn học:{" "}
              {departmentInfo.members.map((m: any) => (
                <span
                  key={m.subject_id}
                  className="inline-block bg-blue-100 rounded-full px-3 py-1 text-sm font-semibold text-blue-700 mr-2"
                >
                  {m.subject_name}
                </span>
              ))}
            </p>
            <p className="mt-2">
              Tổ trưởng:{" "}
              {departmentInfo.headofDepartmentInfo ? (
                <span className="font-semibold text-blue-800">
                  {departmentInfo.headofDepartmentInfo.name} (
                  {departmentInfo.headofDepartmentInfo.email})
                </span>
              ) : (
                <span className="text-gray-500 italic">
                  Chưa có thông tin tổ trưởng
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="email"
              placeholder="Nhập email giáo viên"
              value={newTeacherInfo.email}
              onChange={(e) =>
                setNewTeacherInfo({ ...newTeacherInfo, email: e.target.value })
              }
              className="border p-2 rounded-md"
            />
            <select
              value={newTeacherInfo.subject}
              onChange={(e) =>
                setNewTeacherInfo({
                  ...newTeacherInfo,
                  subject: e.target.value,
                })
              }
              className="border p-2 rounded-md"
            >
              <option value="">Chọn môn dạy</option>
              {departmentInfo.members.map((m: any) => (
                <option key={m.subject_id} value={m.subject_id}>
                  {m.subject_name}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-md"
              onClick={handleAddTeacher}
            >
              Thêm giáo viên
            </button>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm giáo viên"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded-md"
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Mã giáo viên
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Họ và tên
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Số điện thoại
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Môn dạy
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departmentInfo.members.map((m: any) =>
                m.users
                  .filter((u: any) =>
                    u.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((user: any) => (
                    <tr key={user._id}>
                      <td className="py-2 px-4">{user.tdt_id}</td>
                      <td className="py-2 px-4">{user.name}</td>
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        {user.phone_number.startsWith("0")
                          ? user.phone_number
                          : "0" + user.phone_number}
                      </td>
                      <td className="py-2 px-4">{m.subject_name}</td>
                      <td className="py-2 px-4 text-center flex items-center justify-center gap-3">
                        <button
                          onClick={() =>
                            handleRemoveTeacher(user._id, m.subject_id)
                          }
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <MdDelete className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleViewTeacherDetail(user.tdt_id)}
                          className="text-blue-500 hover:text-blue-700 cursor-pointer"
                        >
                          <IoInformationCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;
