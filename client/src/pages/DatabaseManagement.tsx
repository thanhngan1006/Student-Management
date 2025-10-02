import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FaFileUpload, FaUpload } from "react-icons/fa";
import Swal from "sweetalert2";

const UploadSection = ({
  title,
  description,
  type,
  classId,
}: {
  title: string;
  description: string;
  type: string;
  classId?: string;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (type: string, file: File) => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    let endpoint = "";
    switch (type) {
      case "subjects":
        endpoint = "http://localhost:4001/api/subjects/import-subjects";
        break;
      case "semesters":
        endpoint = "http://localhost:4001/api/semesters/import-semesters";
        break;
      case "grades":
        endpoint = "http://localhost:4002/api/students/import-scores";
        break;
      case "members":
        if (!classId) {
          Swal.fire("Lỗi", "Không tìm thấy lớp của bạn", "error");
          setUploading(false);
          return;
        }
        endpoint = `http://localhost:4000/api/classes/${classId}/import-students`;
        break;
      case "students":
        endpoint = "http://localhost:4003/api/users/import-file";
        break;
      case "cvht":
        endpoint = "http://localhost:4003/api/users/import-advisors";
        break;
      default:
        Swal.fire("Lỗi", "Loại dữ liệu không hợp lệ", "error");
        setUploading(false);
        return;
    }

    try {
      const res = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      Swal.fire(
        "Thành công",
        res.data.message || "Tải lên thành công",
        "success"
      );
      setFile(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể tải lên";
      Swal.fire("Lỗi", msg, "error");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 italic mb-4">{description}</p>
      <div className="flex gap-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id={`file-input-${type}`}
        />
        <label
          htmlFor={`file-input-${type}`}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FaUpload />
          Chọn file
        </label>

        <button
          disabled={!file}
          onClick={() => handleFileUpload(type, file!)}
          className={`flex items-center gap-2 px-4 py-2 ${
            file
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-400 cursor-not-allowed"
          } text-white rounded-md`}
        >
          <FaFileUpload />
          {uploading ? "Đang tải..." : "Tải lên"}
        </button>
      </div>
      {file && (
        <p className="text-sm text-gray-500 mt-1">Đã chọn: {file.name}</p>
      )}
    </div>
  );
};

const DatabaseManagement = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role;

  const [classId, setClassId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const { isHomeroomTeacher, isSubjectTeacher } = useMemo(() => {
    if (!user || user.role !== "advisor") {
      return { isHomeroomTeacher: false, isSubjectTeacher: false };
    }
    return {
      isHomeroomTeacher:
        Array.isArray(user.advisor_type) &&
        user.advisor_type.includes("homeroom_teacher"),
      isSubjectTeacher: true,
    };
  }, [user]);

  useEffect(() => {
    const fetchClassId = async () => {
      if (role !== "advisor") return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `http://localhost:4000/api/teachers/${user._id}/class`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setClassId(res.data.class.class_id);
      } catch (error) {
        console.error("Lỗi khi lấy classId:", error);
        setClassId("");
      } finally {
        setLoading(false);
      }
    };
    fetchClassId();
  }, [role, user._id]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Quản lý cơ sở dữ liệu</h1>
      <p className="text-gray-600 mb-8">
        Nơi tải lên dữ liệu học sinh, điểm số, kỳ học, môn học
      </p>
      {/* {loading ? (
        <div className="text-gray-500 italic">Đang tải dữ liệu lớp học...</div>
      ) : ( */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {role === "admin" && (
          <>
            <UploadSection
              type="cvht"
              title="Danh sách CVHT"
              description="Tải danh sách tài khoản và thông tin giáo viên."
            />
            <UploadSection
              type="students"
              title="Danh sách học sinh"
              description="Tải danh sách tài khoản và thông tin học sinh."
            />

            <UploadSection
              type="subjects"
              title="Danh sách môn học"
              description="Tải danh sách môn học lên hệ thống."
            />
            <UploadSection
              type="semesters"
              title="Danh sách kỳ học"
              description="Tải danh sách kỳ học lên hệ thống."
            />
          </>
        )}

        {/* {role === "advisor" && classId && (
          <>
            {isHomeroomTeacher && (
              <UploadSection
                type="students"
                title="Danh sách học sinh"
                description="Tải danh sách tài khoản và thông tin học sinh."
              />
            )}

            <UploadSection
              type="semesters"
              title="Danh sách kỳ học"
              description="Tải danh sách kỳ học lên hệ thống."
            />
            <UploadSection
              type="grades"
              title="Cập nhật bảng điểm"
              description="Tải bảng điểm của học sinh."
            />
          </>
        )} */}

        {role === "advisor" && (
          <>
            {isHomeroomTeacher && classId && (
              <UploadSection
                type="members"
                title="Danh sách học sinh"
                description="Tải danh sách tài khoản và thông tin học sinh."
                classId={classId}
              />
            )}

            <UploadSection
              type="semesters"
              title="Danh sách kỳ học"
              description="Tải danh sách kỳ học lên hệ thống."
            />
            <UploadSection
              type="grades"
              title="Cập nhật bảng điểm"
              description="Tải bảng điểm của học sinh."
            />
          </>
        )}
      </div>
      {/* )} */}

      {role === "advisor" && (
        <div className="mt-4 text-gray-600 italic">
          <p>
            Lưu ý: Các học sinh sẽ chưa được thêm lớp. Yêu cầu CVHT tạo lớp và
            thêm tại bảng Thông tin SV.
          </p>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement;
